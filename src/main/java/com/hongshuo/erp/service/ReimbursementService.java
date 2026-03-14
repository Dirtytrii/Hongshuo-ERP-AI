package com.hongshuo.erp.service;

import com.hongshuo.erp.model.FinanceRecord;
import com.hongshuo.erp.model.Project;
import com.hongshuo.erp.model.Reimbursement;
import com.hongshuo.erp.repository.DepartmentRepository;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import com.hongshuo.erp.repository.ProjectRepository;
import com.hongshuo.erp.repository.ReimbursementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReimbursementService {
    private final ReimbursementRepository reimbursementRepository;
    private final ProjectRepository projectRepository;
    private final DepartmentRepository departmentRepository;
    private final FinanceRecordRepository financeRecordRepository;
    private final ProjectDocumentAutoCollectService projectDocumentAutoCollectService;
    private final WorkflowNotifyService workflowNotifyService;

    /**
     * 查询报销单列表。
     *
     * @param projectId 项目ID（可空）
     * @param departmentId 部门ID（可空）
     * @param status 状态（可空）
     * @return 报销单列表
     */
    public List<Reimbursement> findAll(Long projectId, Long departmentId, String status) {
        List<Reimbursement> base;
        if (projectId != null) {
            base = reimbursementRepository.findByProjectIdOrderByDateDesc(projectId);
        } else if (departmentId != null) {
            base = reimbursementRepository.findByDepartmentIdOrderByDateDesc(departmentId);
        } else if (status != null && !status.isBlank()) {
            base = reimbursementRepository.findByStatusOrderByDateDesc(status);
        } else {
            base = reimbursementRepository.findAll();
        }
        return base.stream()
            .filter(r -> departmentId == null || departmentId.equals(r.getDepartmentId()))
            .filter(r -> status == null || status.isBlank() || status.equals(r.getStatus()))
            .toList();
    }

    /**
     * 根据ID查询报销单。
     *
     * @param id 报销单ID
     * @return 报销单详情
     */
    public Optional<Reimbursement> findById(Long id) {
        return reimbursementRepository.findById(id);
    }

    /**
     * 创建报销单（默认草稿）。
     *
     * @param reimbursement 报销单
     * @return 创建后的报销单
     */
    @Transactional
    public Reimbursement create(Reimbursement reimbursement) {
        validateBase(reimbursement);
        if (reimbursement.getStatus() == null || reimbursement.getStatus().isBlank()) {
            reimbursement.setStatus("draft");
        }
        if (reimbursement.getDate() == null) {
            reimbursement.setDate(LocalDate.now());
        }
        reimbursement.setId(null);
        return reimbursementRepository.save(reimbursement);
    }

    /**
     * 更新报销单（仅草稿可编辑）。
     *
     * @param id 报销单ID
     * @param updates 更新内容
     * @return 更新后的报销单
     */
    @Transactional
    public Reimbursement update(Long id, Reimbursement updates) {
        Reimbursement existing = reimbursementRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("报销单不存在: " + id));
        if (!"draft".equals(existing.getStatus())) {
            throw new RuntimeException("仅草稿状态可编辑");
        }
        validateBase(updates);
        existing.setProjectId(updates.getProjectId());
        existing.setDepartmentId(updates.getDepartmentId());
        existing.setApplicant(updates.getApplicant().trim());
        existing.setAmount(updates.getAmount());
        existing.setCategory(updates.getCategory().trim());
        existing.setDescription(updates.getDescription());
        existing.setDate(updates.getDate() != null ? updates.getDate() : existing.getDate());
        return reimbursementRepository.save(existing);
    }

    /**
     * 提交报销单（草稿 -> submitted）。
     *
     * @param id 报销单ID
     * @return 更新后的报销单
     */
    @Transactional
    public Reimbursement submit(Long id) {
        Reimbursement existing = reimbursementRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("报销单不存在: " + id));
        if (!"draft".equals(existing.getStatus())) {
            throw new RuntimeException("仅草稿状态可提交");
        }
        existing.setStatus("submitted");
        Reimbursement saved = reimbursementRepository.save(existing);
        workflowNotifyService.notifySubmitted(
            "报销单",
            saved.getId(),
            saved.getApplicant(),
            "金额: " + saved.getAmount()
        );
        return saved;
    }

    /**
     * 审批报销单（submitted -> approved/rejected）。
     *
     * @param id 报销单ID
     * @param approver 审批人
     * @param approved 是否通过
     * @param approvalNote 审批意见
     * @return 更新后的报销单
     */
    @Transactional
    public Reimbursement approve(Long id, String approver, boolean approved, String approvalNote) {
        Reimbursement existing = reimbursementRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("报销单不存在: " + id));
        if (!"submitted".equals(existing.getStatus())) {
            throw new RuntimeException("仅提交状态可审批");
        }
        existing.setStatus(approved ? "approved" : "rejected");
        existing.setApprover(approver);
        existing.setApprovalDate(LocalDate.now());
        existing.setApprovalNote(approvalNote != null ? approvalNote : "");
        Reimbursement saved = reimbursementRepository.save(existing);

        if (approved) {
            writeBackCost(saved);
            autoCollectDocument(saved);
        }
        workflowNotifyService.notifyApprovalResult("报销单", saved.getId(), approved, approver);
        return saved;
    }

    /**
     * 删除报销单（非已通过可删除）。
     *
     * @param id 报销单ID
     */
    @Transactional
    public void delete(Long id) {
        Reimbursement existing = reimbursementRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("报销单不存在: " + id));
        if ("approved".equals(existing.getStatus())) {
            throw new RuntimeException("已通过报销单不可删除");
        }
        reimbursementRepository.deleteById(id);
    }

    private void validateBase(Reimbursement reimbursement) {
        if (reimbursement.getApplicant() == null || reimbursement.getApplicant().isBlank()) {
            throw new RuntimeException("报销人不能为空");
        }
        if (reimbursement.getAmount() == null || reimbursement.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("报销金额必须大于0");
        }
        if (reimbursement.getCategory() == null || reimbursement.getCategory().isBlank()) {
            throw new RuntimeException("报销类别不能为空");
        }
        if (reimbursement.getProjectId() != null && projectRepository.findById(reimbursement.getProjectId()).isEmpty()) {
            throw new RuntimeException("项目不存在: " + reimbursement.getProjectId());
        }
        if (reimbursement.getDepartmentId() != null && departmentRepository.findById(reimbursement.getDepartmentId()).isEmpty()) {
            throw new RuntimeException("部门不存在: " + reimbursement.getDepartmentId());
        }
        if (reimbursement.getCreator() == null || reimbursement.getCreator().isBlank()) {
            reimbursement.setCreator(reimbursement.getApplicant());
        }
    }

    private void writeBackCost(Reimbursement reimbursement) {
        if (reimbursement.getProjectId() == null) {
            return;
        }
        Project project = projectRepository.findById(reimbursement.getProjectId()).orElse(null);
        if (project == null) {
            return;
        }
        project.setOtherCost((project.getOtherCost() != null ? project.getOtherCost() : BigDecimal.ZERO)
            .add(reimbursement.getAmount()));
        projectRepository.save(project);

        FinanceRecord record = new FinanceRecord();
        record.setType(FinanceRecord.FinanceType.expense);
        record.setCategory("间接管理费");
        record.setCostType("other");
        record.setAmount(reimbursement.getAmount());
        record.setProjectId(reimbursement.getProjectId());
        record.setDepartmentId(reimbursement.getDepartmentId());
        record.setStatus("approved");
        record.setDate(LocalDate.now());
        record.setCreator(reimbursement.getApprover() != null ? reimbursement.getApprover() : reimbursement.getCreator());
        record.setDescription("报销审批通过自动记账: " + reimbursement.getCategory());
        financeRecordRepository.save(record);
    }

    private void autoCollectDocument(Reimbursement reimbursement) {
        if (reimbursement.getProjectId() == null) {
            return;
        }
        String link = "/reimbursements/" + reimbursement.getId();
        String remark = "报销审批通过，金额: " + reimbursement.getAmount() + "，报销人: " + reimbursement.getApplicant();
        projectDocumentAutoCollectService.collect(
            reimbursement.getProjectId(),
            "reimbursement",
            "报销单 #" + reimbursement.getId(),
            link,
            remark
        );
    }
}
