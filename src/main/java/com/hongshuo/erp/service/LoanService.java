package com.hongshuo.erp.service;

import com.hongshuo.erp.model.Department;
import com.hongshuo.erp.model.Loan;
import com.hongshuo.erp.repository.DepartmentRepository;
import com.hongshuo.erp.repository.LoanRepository;
import com.hongshuo.erp.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LoanService {
    private final LoanRepository loanRepository;
    private final ProjectRepository projectRepository;
    private final DepartmentRepository departmentRepository;
    private final LoanRepaymentService loanRepaymentService;
    private final ProjectDocumentAutoCollectService projectDocumentAutoCollectService;
    private final WorkflowNotifyService workflowNotifyService;

    /**
     * 查询借款单列表。
     *
     * @param projectId 项目ID（可空）
     * @param departmentId 部门ID（可空）
     * @param status 状态（可空）
     * @return 借款单列表
     */
    public List<Loan> findAll(Long projectId, Long departmentId, String status) {
        List<Loan> base;
        if (projectId != null) {
            base = loanRepository.findByProjectIdOrderByDateDesc(projectId);
        } else if (departmentId != null) {
            base = loanRepository.findByDepartmentIdOrderByDateDesc(departmentId);
        } else if (status != null && !status.isBlank()) {
            base = loanRepository.findByStatusOrderByDateDesc(status);
        } else {
            base = loanRepository.findAll();
        }
        return base.stream()
            .filter(l -> departmentId == null || departmentId.equals(l.getDepartmentId()))
            .filter(l -> status == null || status.isBlank() || status.equals(l.getStatus()))
            .toList();
    }

    /**
     * 根据ID查询借款单。
     *
     * @param id 借款单ID
     * @return 借款单详情
     */
    public Optional<Loan> findById(Long id) {
        return loanRepository.findById(id);
    }

    /**
     * 创建借款单（默认草稿）。
     *
     * @param loan 借款单
     * @return 创建后的借款单
     */
    @Transactional
    public Loan create(Loan loan) {
        validateBase(loan);
        if (loan.getDate() == null) {
            loan.setDate(LocalDate.now());
        }
        if (loan.getStatus() == null || loan.getStatus().isBlank()) {
            loan.setStatus("draft");
        }
        loan.setId(null);
        return loanRepository.save(loan);
    }

    /**
     * 更新借款单（仅草稿可编辑）。
     *
     * @param id 借款单ID
     * @param updates 更新内容
     * @return 更新后的借款单
     */
    @Transactional
    public Loan update(Long id, Loan updates) {
        Loan existing = loanRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("借款单不存在: " + id));
        if (!"draft".equals(existing.getStatus())) {
            throw new RuntimeException("仅草稿状态可编辑");
        }
        validateBase(updates);
        existing.setProjectId(updates.getProjectId());
        existing.setDepartmentId(updates.getDepartmentId());
        existing.setBorrower(updates.getBorrower().trim());
        existing.setAmount(updates.getAmount());
        existing.setReason(updates.getReason());
        existing.setDate(updates.getDate() != null ? updates.getDate() : existing.getDate());
        return loanRepository.save(existing);
    }

    /**
     * 提交借款单（草稿 -> submitted）。
     *
     * @param id 借款单ID
     * @return 更新后的借款单
     */
    @Transactional
    public Loan submit(Long id) {
        Loan existing = loanRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("借款单不存在: " + id));
        if (!"draft".equals(existing.getStatus())) {
            throw new RuntimeException("仅草稿状态可提交");
        }
        existing.setStatus("submitted");
        Loan saved = loanRepository.save(existing);
        workflowNotifyService.notifySubmitted(
            "借款单",
            saved.getId(),
            saved.getBorrower(),
            "金额: " + saved.getAmount()
        );
        return saved;
    }

    /**
     * 审批借款单（submitted -> approved/rejected）。
     *
     * @param id 借款单ID
     * @param approver 审批人
     * @param approved 是否通过
     * @param approvalNote 审批意见
     * @return 更新后的借款单
     */
    @Transactional
    public Loan approve(Long id, String approver, boolean approved, String approvalNote) {
        Loan existing = loanRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("借款单不存在: " + id));
        if (!"submitted".equals(existing.getStatus())) {
            throw new RuntimeException("仅提交状态可审批");
        }
        existing.setStatus(approved ? "approved" : "rejected");
        existing.setApprover(approver);
        existing.setApprovalDate(LocalDate.now());
        existing.setApprovalNote(approvalNote != null ? approvalNote : "");
        Loan saved = loanRepository.save(existing);
        if (approved) {
            autoCollectDocument(saved);
        }
        workflowNotifyService.notifyApprovalResult("借款单", saved.getId(), approved, approver);
        return saved;
    }

    /**
     * 删除借款单（已通过不可删）。
     *
     * @param id 借款单ID
     */
    @Transactional
    public void delete(Long id) {
        Loan existing = loanRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("借款单不存在: " + id));
        if ("approved".equals(existing.getStatus())) {
            throw new RuntimeException("已通过借款单不可删除");
        }
        loanRepository.deleteById(id);
    }

    /**
     * 查询借款未还金额。
     *
     * @param loanId 借款单ID
     * @return 未还金额
     */
    public BigDecimal getOutstandingAmount(Long loanId) {
        Loan loan = loanRepository.findById(loanId).orElse(null);
        if (loan == null || !"approved".equals(loan.getStatus())) {
            return BigDecimal.ZERO;
        }
        BigDecimal repaid = loanRepaymentService.sumApprovedByLoanId(loanId);
        BigDecimal outstanding = loan.getAmount().subtract(repaid);
        return outstanding.compareTo(BigDecimal.ZERO) > 0 ? outstanding : BigDecimal.ZERO;
    }

    private void validateBase(Loan loan) {
        if (loan.getBorrower() == null || loan.getBorrower().isBlank()) {
            throw new RuntimeException("借款人不能为空");
        }
        if (loan.getAmount() == null || loan.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("借款金额必须大于0");
        }
        if (loan.getProjectId() != null && projectRepository.findById(loan.getProjectId()).isEmpty()) {
            throw new RuntimeException("项目不存在: " + loan.getProjectId());
        }
        if (loan.getDepartmentId() != null) {
            Department dep = departmentRepository.findById(loan.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("部门不存在: " + loan.getDepartmentId()));
            if (dep.getId() == null) {
                throw new RuntimeException("部门不存在: " + loan.getDepartmentId());
            }
        }
        if (loan.getCreator() == null || loan.getCreator().isBlank()) {
            loan.setCreator(loan.getBorrower());
        }
    }

    private void autoCollectDocument(Loan loan) {
        if (loan.getProjectId() == null) {
            return;
        }
        String link = "/loans/" + loan.getId();
        String remark = "借款审批通过，金额: " + loan.getAmount() + "，借款人: " + loan.getBorrower();
        projectDocumentAutoCollectService.collect(
            loan.getProjectId(),
            "loan",
            "借款单 #" + loan.getId(),
            link,
            remark
        );
    }
}
