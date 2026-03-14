package com.hongshuo.erp.service;

import com.hongshuo.erp.model.StockLog;
import com.hongshuo.erp.model.InventoryItem;
import com.hongshuo.erp.repository.StockLogRepository;
import com.hongshuo.erp.repository.InventoryItemRepository;
import com.hongshuo.erp.repository.SystemLogRepository;
import com.hongshuo.erp.model.SystemLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class StockService {
    
    @Autowired
    private StockLogRepository stockLogRepository;
    
    @Autowired
    private InventoryItemRepository inventoryItemRepository;
    
    @Autowired
    private SystemLogRepository systemLogRepository;

    @Autowired
    private com.hongshuo.erp.service.ProjectService projectService;
    
    /**
     * 创建库存操作记录（入库或出库申请）
     * 出库需要项目经理审核，但Admin可以直接出库
     * 入库直接生效
     */
    @Transactional
    public StockLog createStockLog(StockLog stockLog, String creatorRole) {
        InventoryItem item = inventoryItemRepository.findById(stockLog.getItemId())
            .orElseThrow(() -> new RuntimeException("物料不存在: " + stockLog.getItemId()));
        
        // 出库操作
        if (stockLog.getType() == StockLog.StockType.out) {
            // 检查库存是否充足
            if (item.getQuantity() < stockLog.getQty()) {
                throw new RuntimeException("库存不足，当前库存: " + item.getQuantity() + ", 申请出库: " + stockLog.getQty());
            }
            
            // 检查是否为Admin：Admin可以直接出库，不需要审批
            boolean isAdmin = creatorRole != null && (
                creatorRole.toLowerCase().contains("admin") || 
                creatorRole.contains("管理员") || 
                creatorRole.contains("王总")
            );
            
            if (isAdmin) {
                // Admin直接出库，立即生效
                item.setQuantity(item.getQuantity() - stockLog.getQty());
                inventoryItemRepository.save(item);
                stockLog.setStatus("active");
                stockLog.setCreator(creatorRole);
                stockLog.setDate(LocalDate.now());
                // 超预算校验（关联项目且将生效时）
                if (stockLog.getProjectId() != null) {
                    BigDecimal outAmount = BigDecimal.valueOf(stockLog.getQty()).multiply(stockLog.getPrice());
                    projectService.checkOverBudgetAllowAdmin(stockLog.getProjectId(), outAmount, creatorRole);
                }
                // 记录系统日志
                logSystemAction(creatorRole, "物料出库", 
                    String.format("物料: %s, 数量: %d, 项目ID: %s", item.getName(), stockLog.getQty(), stockLog.getProjectId()));
            } else {
                // 普通用户出库需要项目经理审核
                stockLog.setStatus("pending");
                stockLog.setCreator(creatorRole);
                stockLog.setDate(LocalDate.now());
                
                // 记录系统日志
                logSystemAction(creatorRole, "申请出库", 
                    String.format("物料: %s, 数量: %d, 项目ID: %s", item.getName(), stockLog.getQty(), stockLog.getProjectId()));
            }
        } else {
            // 入库直接生效
            item.setQuantity(item.getQuantity() + stockLog.getQty());
            inventoryItemRepository.save(item);
            stockLog.setStatus("active");
            stockLog.setCreator(creatorRole);
            stockLog.setDate(LocalDate.now());
            
            // 记录系统日志
            logSystemAction(creatorRole, "物料入库", 
                String.format("物料: %s, 数量: %d", item.getName(), stockLog.getQty()));
        }
        
        return stockLogRepository.save(stockLog);
    }
    
    /**
     * 审核出库申请
     * 只有项目经理（pm）可以审核
     */
    @Transactional
    public StockLog approveStockOut(Long logId, String approverRole, String approvalNote, boolean approved) {
        StockLog stockLog = stockLogRepository.findById(logId)
            .orElseThrow(() -> new RuntimeException("出库记录不存在: " + logId));
        
        if (stockLog.getType() != StockLog.StockType.out) {
            throw new RuntimeException("只能审核出库记录");
        }
        
        if (!"pending".equals(stockLog.getStatus())) {
            throw new RuntimeException("该记录已处理，无法再次审核");
        }
        
        // 检查权限：项目经理和管理员可以审核
        boolean isAdmin = approverRole != null && (
            approverRole.toLowerCase().contains("admin") || 
            approverRole.contains("管理员") || 
            approverRole.contains("王总")
        );
        boolean isPM = approverRole != null && (
            approverRole.toLowerCase().contains("pm") || 
            approverRole.contains("项目经理") || 
            approverRole.contains("李工")
        );
        
        if (!isAdmin && !isPM) {
            throw new RuntimeException("只有项目经理或管理员可以审核出库申请");
        }
        
        InventoryItem item = inventoryItemRepository.findById(stockLog.getItemId())
            .orElseThrow(() -> new RuntimeException("物料不存在"));
        
        if (approved) {
            // 超预算校验（关联项目时）
            if (stockLog.getProjectId() != null) {
                BigDecimal outAmount = BigDecimal.valueOf(stockLog.getQty()).multiply(stockLog.getPrice());
                projectService.checkOverBudgetAllowAdmin(stockLog.getProjectId(), outAmount, approverRole);
            }
            // 批准：更新库存
            if (item.getQuantity() < stockLog.getQty()) {
                throw new RuntimeException("库存不足，无法批准出库");
            }
            item.setQuantity(item.getQuantity() - stockLog.getQty());
            inventoryItemRepository.save(item);
            
            stockLog.setStatus("active");
            stockLog.setApprover(approverRole);
            stockLog.setApprovalDate(LocalDate.now());
            stockLog.setApprovalNote(approvalNote);
            
            logSystemAction(approverRole, "批准出库", 
                String.format("物料: %s, 数量: %d", item.getName(), stockLog.getQty()));
        } else {
            // 拒绝
            stockLog.setStatus("rejected");
            stockLog.setApprover(approverRole);
            stockLog.setApprovalDate(LocalDate.now());
            stockLog.setApprovalNote(approvalNote);
            
            logSystemAction(approverRole, "拒绝出库", 
                String.format("物料: %s, 数量: %d, 原因: %s", item.getName(), stockLog.getQty(), approvalNote));
        }
        
        return stockLogRepository.save(stockLog);
    }
    
    /**
     * 红字冲销：根据原单创建库存冲销单。
     * <ul>
     *   <li>出库冲销：冲销单审批通过后回增库存、回减项目出库金额</li>
     *   <li>入库冲销：冲销单生效后回减库存</li>
     * </ul>
     * 仅管理员或库管可发起库存冲销。冲销单需审批（status = pending），审批通过后生效。
     *
     * @param originalId   原单 ID
     * @param reversalNote 冲销说明
     * @param creatorRole  发起人角色
     * @return 冲销单记录
     */
    @Transactional
    public StockLog createReversal(Long originalId, String reversalNote, String creatorRole) {
        if (!isAllowedToCreateStockReversal(creatorRole)) {
            throw new RuntimeException("仅管理员或库管可发起库存冲销");
        }
        StockLog original = stockLogRepository.findById(originalId)
            .orElseThrow(() -> new RuntimeException("原单不存在，无法冲销"));
        if (!"active".equals(original.getStatus())) {
            throw new RuntimeException("只能对已生效的库存记录进行冲销");
        }
        if (Boolean.TRUE.equals(original.getIsReversal())) {
            throw new RuntimeException("不能对冲销单再次冲销");
        }

        StockLog reversal = new StockLog();
        reversal.setType(original.getType());
        reversal.setItemId(original.getItemId());
        reversal.setQty(-original.getQty());
        reversal.setPrice(original.getPrice());
        reversal.setProjectId(original.getProjectId());
        reversal.setSupplierId(original.getSupplierId());
        reversal.setReversalOfId(originalId);
        reversal.setIsReversal(true);
        reversal.setStatus("pending");
        reversal.setCreator(creatorRole);
        reversal.setDate(LocalDate.now());
        reversal.setNote(reversalNote != null && !reversalNote.isBlank()
            ? reversalNote
            : "冲销：原单#" + originalId);

        StockLog saved = stockLogRepository.save(reversal);
        logSystemAction(creatorRole, "申请库存冲销",
            String.format("原单#%d 类型:%s 物料ID:%d 数量:%d", originalId, original.getType(), original.getItemId(), original.getQty()));
        return saved;
    }

    /**
     * 审核库存冲销单。审批通过后执行库存回算。
     *
     * @param logId        冲销单 ID
     * @param approverRole 审批人角色
     * @param approvalNote 审批备注
     * @param approved     是否通过
     * @return 更新后的冲销单
     */
    @Transactional
    public StockLog approveReversal(Long logId, String approverRole, String approvalNote, boolean approved) {
        StockLog reversal = stockLogRepository.findById(logId)
            .orElseThrow(() -> new RuntimeException("冲销记录不存在: " + logId));
        if (!Boolean.TRUE.equals(reversal.getIsReversal())) {
            throw new RuntimeException("该记录不是冲销单，请使用常规审批接口");
        }
        if (!"pending".equals(reversal.getStatus())) {
            throw new RuntimeException("该冲销单已处理，无法再次审核");
        }

        boolean isAdmin = approverRole != null && (
            approverRole.toLowerCase().contains("admin") ||
            approverRole.contains("管理员") ||
            approverRole.contains("王总")
        );
        if (!isAdmin) {
            throw new RuntimeException("仅管理员可审批库存冲销单");
        }

        if (approved) {
            InventoryItem item = inventoryItemRepository.findById(reversal.getItemId())
                .orElseThrow(() -> new RuntimeException("物料不存在"));

            if (reversal.getType() == StockLog.StockType.out) {
                // 出库冲销 → 回增库存（qty 为负，取绝对值加回）
                item.setQuantity(item.getQuantity() + Math.abs(reversal.getQty()));
            } else {
                // 入库冲销 → 回减库存
                int reduceQty = Math.abs(reversal.getQty());
                if (item.getQuantity() < reduceQty) {
                    throw new RuntimeException("库存不足，无法冲销入库记录（当前库存: " + item.getQuantity() + "）");
                }
                item.setQuantity(item.getQuantity() - reduceQty);
            }
            inventoryItemRepository.save(item);

            reversal.setStatus("active");
            reversal.setApprover(approverRole);
            reversal.setApprovalDate(LocalDate.now());
            reversal.setApprovalNote(approvalNote);

            logSystemAction(approverRole, "批准库存冲销",
                String.format("冲销单#%d 物料: %s 类型: %s 数量: %d", logId, item.getName(), reversal.getType(), reversal.getQty()));
        } else {
            reversal.setStatus("rejected");
            reversal.setApprover(approverRole);
            reversal.setApprovalDate(LocalDate.now());
            reversal.setApprovalNote(approvalNote);

            logSystemAction(approverRole, "拒绝库存冲销",
                String.format("冲销单#%d 原因: %s", logId, approvalNote));
        }

        return stockLogRepository.save(reversal);
    }

    public List<StockLog> getAllStockLogs() {
        return stockLogRepository.findAll();
    }
    
    public List<StockLog> getPendingStockLogs() {
        return stockLogRepository.findByStatus("pending");
    }
    
    public Optional<StockLog> getStockLogById(Long id) {
        return stockLogRepository.findById(id);
    }

    private static boolean isAllowedToCreateStockReversal(String creatorRole) {
        if (creatorRole == null) return false;
        String r = creatorRole.toLowerCase();
        return r.contains("admin") || r.contains("管理员") || r.contains("clerk") || r.contains("库管");
    }
    
    private void logSystemAction(String operator, String action, String detail) {
        SystemLog log = new SystemLog();
        log.setTime(LocalDateTime.now());
        log.setUser(operator);
        log.setAction(action);
        log.setDetail(detail);
        systemLogRepository.save(log);
    }
}

