package com.hongshuo.erp.service;

import com.hongshuo.erp.model.FinanceRecord;
import com.hongshuo.erp.model.Project;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import com.hongshuo.erp.repository.ProjectRepository;
import com.hongshuo.erp.repository.SystemLogRepository;
import com.hongshuo.erp.model.SystemLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class FinanceService {

    /** 允许的支出类别及对应的项目成本类型（material/labor/other） */
    public static final List<Map<String, String>> EXPENSE_CATEGORIES = List.of(
        Map.of("code", "人工费", "label", "人工费", "costType", "labor"),
        Map.of("code", "材料费", "label", "材料费", "costType", "material"),
        Map.of("code", "机械费", "label", "机械费", "costType", "other"),
        Map.of("code", "分包费", "label", "分包费", "costType", "other"),
        Map.of("code", "间接管理费", "label", "间接管理费", "costType", "other")
    );

    private static final Set<String> ALLOWED_EXPENSE_CATEGORY_CODES = Set.of(
        "人工费", "材料费", "机械费", "分包费", "间接管理费"
    );
    
    // 大额支出阈值：10万元
    private static final BigDecimal LARGE_EXPENSE_THRESHOLD = new BigDecimal("100000");
    
    @Autowired
    private FinanceRecordRepository financeRecordRepository;
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private ProjectService projectService;
    
    @Autowired
    private SystemLogRepository systemLogRepository;

    @Autowired
    private ProjectDocumentAutoCollectService projectDocumentAutoCollectService;

    @Autowired
    private WorkflowNotifyService workflowNotifyService;
    
    /** 支出类别 -> 项目成本类型（仅允许的枚举类别） */
    private static String categoryToCostType(String category) {
        String c = normalizeExpenseCategory(category);
        if (c == null) return "other";
        for (Map<String, String> row : EXPENSE_CATEGORIES) {
            if (row.get("code").equals(c)) {
                return row.get("costType");
            }
        }
        return "other";
    }

    /**
     * 兼容历史数据类别（如：材料采购/设备/办公费），统一映射到标准支出类别。
     */
    private static String normalizeExpenseCategory(String rawCategory) {
        if (rawCategory == null) return null;
        String c = rawCategory.trim();
        if (ALLOWED_EXPENSE_CATEGORY_CODES.contains(c)) {
            return c;
        }
        if (c.contains("材料")) return "材料费";
        if (c.contains("人工") || c.contains("工资")) return "人工费";
        if (c.contains("机械") || c.contains("设备")) return "机械费";
        if (c.contains("分包")) return "分包费";
        if (c.contains("管理") || c.contains("办公") || c.contains("差旅") || c.contains("招待") || c.contains("大额")) {
            return "间接管理费";
        }
        return null;
    }
    
    /**
     * 创建财务记录
     * 支出时 category 必须在允许的枚举内；大额支出（>=10万）需要管理员审核
     * 红字冲销：isReversal=true 且 reversalOfId 指向已审批原单，创建负金额冲销单并回减项目成本/已收款
     */
    @Transactional
    public FinanceRecord createFinanceRecord(FinanceRecord record, String creatorRole) {
        if (Boolean.TRUE.equals(record.getIsReversal()) && record.getReversalOfId() != null) {
            return createReversal(record.getReversalOfId(), record.getDescription(), creatorRole);
        }
        if (record.getType() == FinanceRecord.FinanceType.expense) {
            if (record.getCategory() == null || record.getCategory().isBlank()) {
                throw new IllegalArgumentException("支出类别不能为空，请从下拉选择");
            }
            String normalizedCategory = normalizeExpenseCategory(record.getCategory());
            if (normalizedCategory == null) {
                throw new IllegalArgumentException("支出类别不在允许列表中，请从下拉选择：人工费、材料费、机械费、分包费、间接管理费");
            }
            record.setCategory(normalizedCategory);
        }
        // 判断是否需要审核
        if (record.getType() == FinanceRecord.FinanceType.expense 
            && record.getAmount().compareTo(LARGE_EXPENSE_THRESHOLD) >= 0) {
            // 大额支出需要管理员审核
            record.setStatus("pending");
            logSystemAction(creatorRole, "申请大额财务支出", 
                String.format("类型: %s, 金额: %s, 项目ID: %s", record.getCategory(), record.getAmount(), record.getProjectId()));
        } else {
            // 小额支出或收入直接生效
            record.setStatus("approved");
            logSystemAction(creatorRole, record.getType() == FinanceRecord.FinanceType.income ? "财务收入" : "财务支出", 
                String.format("类型: %s, 金额: %s", record.getCategory(), record.getAmount()));
        }
        
        record.setCreator(creatorRole);
        record.setDate(LocalDate.now());
        if (record.getType() == FinanceRecord.FinanceType.expense) {
            record.setCostType(categoryToCostType(record.getCategory()));
        }
        // 支出且关联项目、将直接生效时，超预算校验（超100%仅管理员可特批）
        FinanceRecord saved = financeRecordRepository.save(record);
        if ("pending".equals(saved.getStatus())) {
            workflowNotifyService.notifySubmitted(
                "财务单",
                saved.getId(),
                saved.getCreator(),
                "类型: " + saved.getCategory() + "，金额: " + saved.getAmount()
            );
        }
        
        if ("approved".equals(saved.getStatus()) && saved.getProjectId() != null && saved.getAmount() != null) {
            if (saved.getType() == FinanceRecord.FinanceType.expense) {
                projectRepository.findByIdForUpdate(saved.getProjectId()).ifPresent(project -> {
                    checkOverBudgetAllowAdmin(project, saved.getAmount(), creatorRole);
                    String costType = saved.getCostType() != null ? saved.getCostType() : categoryToCostType(saved.getCategory());
                    BigDecimal amt = saved.getAmount();
                    if ("material".equals(costType)) project.setMaterialCost(project.getMaterialCost().add(amt));
                    else if ("labor".equals(costType)) project.setLaborCost(project.getLaborCost().add(amt));
                    else project.setOtherCost(project.getOtherCost().add(amt));
                    projectRepository.save(project);
                });
            } else {
                projectRepository.findByIdForUpdate(saved.getProjectId()).ifPresent(project -> {
                    project.setReceivedAmount(project.getReceivedAmount().add(saved.getAmount()));
                    projectRepository.save(project);
                });
            }
            autoCollectFinanceDocument(saved);
        }
        return saved;
    }
    
    /**
     * 审核财务记录
     * 只有管理员（admin）可以审核大额支出
     */
    @Transactional
    public FinanceRecord approveFinanceRecord(Long recordId, String approverRole, String approvalNote, boolean approved) {
        FinanceRecord record = financeRecordRepository.findById(recordId)
            .orElseThrow(() -> new RuntimeException("财务记录不存在: " + recordId));
        
        if (!"pending".equals(record.getStatus())) {
            throw new RuntimeException("该记录已处理，无法再次审核");
        }
        
        // 检查权限：只有管理员可以审核大额支出
        if (!approverRole.contains("admin") && !approverRole.contains("Admin") && !approverRole.contains("管理员")) {
            throw new RuntimeException("只有管理员可以审核大额财务支出");
        }
        
        if (approved) {
            record.setStatus("approved");
            record.setApprover(approverRole);
            record.setApprovalDate(LocalDate.now());
            record.setApprovalNote(approvalNote);
            
            logSystemAction(approverRole, "批准财务支出", 
                String.format("类型: %s, 金额: %s", record.getCategory(), record.getAmount()));
            
            // 超预算校验（超100%仅管理员可特批）
            if (record.getType() == FinanceRecord.FinanceType.expense 
                && record.getProjectId() != null 
                && record.getAmount() != null) {
                projectRepository.findByIdForUpdate(record.getProjectId()).ifPresent(project -> {
                    checkOverBudgetAllowAdmin(project, record.getAmount(), approverRole);
                    String costType = record.getCostType() != null ? record.getCostType() : categoryToCostType(record.getCategory());
                    BigDecimal amt = record.getAmount();
                    if ("material".equals(costType)) {
                        project.setMaterialCost(project.getMaterialCost().add(amt));
                    } else if ("labor".equals(costType)) {
                        project.setLaborCost(project.getLaborCost().add(amt));
                    } else {
                        project.setOtherCost(project.getOtherCost().add(amt));
                    }
                    projectRepository.save(project);
                });
            }
            if (record.getType() == FinanceRecord.FinanceType.income && record.getProjectId() != null && record.getAmount() != null) {
                projectRepository.findByIdForUpdate(record.getProjectId()).ifPresent(project -> {
                    project.setReceivedAmount(project.getReceivedAmount().add(record.getAmount()));
                    projectRepository.save(project);
                });
            }
            autoCollectFinanceDocument(record);
            workflowNotifyService.notifyApprovalResult("财务单", record.getId(), true, approverRole);
        } else {
            record.setStatus("rejected");
            record.setApprover(approverRole);
            record.setApprovalDate(LocalDate.now());
            record.setApprovalNote(approvalNote);
            
            logSystemAction(approverRole, "拒绝财务支出", 
                String.format("类型: %s, 金额: %s, 原因: %s", record.getCategory(), record.getAmount(), approvalNote));
            workflowNotifyService.notifyApprovalResult("财务单", record.getId(), false, approverRole);
        }
        
        return financeRecordRepository.save(record);
    }
    
    public List<FinanceRecord> getAllFinanceRecords() {
        return financeRecordRepository.findAll();
    }
    
    public List<FinanceRecord> getPendingFinanceRecords() {
        return financeRecordRepository.findByStatus("pending");
    }
    
    public Optional<FinanceRecord> getFinanceRecordById(Long id) {
        return financeRecordRepository.findById(id);
    }
    
    public List<FinanceRecord> getFinanceRecordsByProjectId(Long projectId) {
        return financeRecordRepository.findByProjectId(projectId);
    }

    public List<Map<String, String>> getExpenseCategories() {
        return EXPENSE_CATEGORIES;
    }

    /**
     * 红字冲销：根据原单创建冲销单（负金额），状态为 pending，需审批通过后再回减项目成本/已收款。
     * 仅财务或管理员角色可发起财务冲销。
     */
    @Transactional
    public FinanceRecord createReversal(Long originalId, String reversalNote, String creatorRole) {
        if (!isAllowedToCreateFinanceReversal(creatorRole)) {
            throw new RuntimeException("仅财务或管理员可发起财务冲销");
        }
        FinanceRecord original = financeRecordRepository.findById(originalId)
            .orElseThrow(() -> new RuntimeException("原单不存在，无法冲销"));
        if (!"approved".equals(original.getStatus())) {
            throw new RuntimeException("只能对已审批通过的记录进行冲销");
        }
        if (Boolean.TRUE.equals(original.getIsReversal())) {
            throw new RuntimeException("不能对冲销单再次冲销");
        }
        FinanceRecord reversal = new FinanceRecord();
        reversal.setType(original.getType());
        reversal.setCategory(original.getCategory());
        reversal.setAmount(original.getAmount().negate());
        reversal.setProjectId(original.getProjectId());
        reversal.setCostType(original.getCostType());
        reversal.setSupplierId(original.getSupplierId());
        reversal.setPaymentPlanItemId(original.getPaymentPlanItemId());
        reversal.setReversalOfId(originalId);
        reversal.setIsReversal(true);
        reversal.setStatus("pending");
        reversal.setCreator(creatorRole);
        reversal.setDate(LocalDate.now());
        reversal.setDescription(reversalNote != null && !reversalNote.isBlank()
            ? reversalNote
            : "冲销：原单#" + originalId);
        FinanceRecord saved = financeRecordRepository.save(reversal);
        logSystemAction(creatorRole, "申请红字冲销", String.format("原单#%s 类型:%s 冲销金额:%s", originalId, original.getType(), saved.getAmount()));
        return saved;
    }

    private static boolean isAllowedToCreateFinanceReversal(String creatorRole) {
        if (creatorRole == null) return false;
        String r = creatorRole.toLowerCase();
        return r.contains("admin") || r.contains("管理员") || r.contains("finance") || r.contains("财务");
    }
    
    private void checkOverBudgetAllowAdmin(Project project, BigDecimal additionalAmount, String currentUserRole) {
        if (project == null || additionalAmount == null) return;
        BigDecimal budget = project.getTotalBudget();
        if (budget == null || budget.compareTo(BigDecimal.ZERO) <= 0) return;

        BigDecimal fromStock = projectService.getOutboundAmountSum(project.getId());
        if (fromStock == null) fromStock = BigDecimal.ZERO;
        BigDecimal current = zero(project.getMaterialCost())
            .add(fromStock)
            .add(zero(project.getLaborCost()))
            .add(zero(project.getOtherCost()));
        BigDecimal after = current.add(additionalAmount);
        if (after.compareTo(budget) <= 0) return;

        boolean isAdmin = currentUserRole != null && currentUserRole.toLowerCase().contains("admin");
        if (!isAdmin) {
            throw new RuntimeException("Project budget exceeded: budget=" + budget + ", current=" + current);
        }
    }

    private static BigDecimal zero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private void logSystemAction(String user, String action, String detail) {
        SystemLog log = new SystemLog();
        log.setTime(LocalDateTime.now());
        log.setUser(user);
        log.setAction(action);
        log.setDetail(detail);
        systemLogRepository.save(log);
    }

    private void autoCollectFinanceDocument(FinanceRecord record) {
        if (record.getProjectId() == null) {
            return;
        }
        String kind = record.getType() == FinanceRecord.FinanceType.income ? "收入" : "支出";
        String link = "/finance/" + record.getId();
        String remark = kind + "审批通过，金额: " + record.getAmount() + "，类别: " + record.getCategory();
        projectDocumentAutoCollectService.collect(
            record.getProjectId(),
            "finance",
            kind + "单 #" + record.getId(),
            link,
            remark
        );
    }
}

