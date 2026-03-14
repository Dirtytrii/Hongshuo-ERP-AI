package com.hongshuo.erp.service;

import com.hongshuo.erp.model.Loan;
import com.hongshuo.erp.model.LoanRepayment;
import com.hongshuo.erp.repository.LoanRepaymentRepository;
import com.hongshuo.erp.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LoanRepaymentService {
    private final LoanRepaymentRepository loanRepaymentRepository;
    private final LoanRepository loanRepository;
    private final ProjectDocumentAutoCollectService projectDocumentAutoCollectService;
    private final WorkflowNotifyService workflowNotifyService;

    /**
     * 查询还款单列表。
     *
     * @param loanId 借款单ID（可空）
     * @param status 状态（可空）
     * @return 还款单列表
     */
    public List<LoanRepayment> findAll(Long loanId, String status) {
        List<LoanRepayment> base;
        if (loanId != null) {
            base = loanRepaymentRepository.findByLoanIdOrderByDateDesc(loanId);
        } else if (status != null && !status.isBlank()) {
            base = loanRepaymentRepository.findByStatusOrderByDateDesc(status);
        } else {
            base = loanRepaymentRepository.findAll();
        }
        return base.stream()
            .filter(r -> status == null || status.isBlank() || status.equals(r.getStatus()))
            .toList();
    }

    /**
     * 根据ID查询还款单。
     *
     * @param id 还款单ID
     * @return 还款单详情
     */
    public Optional<LoanRepayment> findById(Long id) {
        return loanRepaymentRepository.findById(id);
    }

    /**
     * 创建还款单（默认草稿）。
     *
     * @param repayment 还款单
     * @return 创建后的还款单
     */
    @Transactional
    public LoanRepayment create(LoanRepayment repayment) {
        validateBase(repayment);
        if (repayment.getStatus() == null || repayment.getStatus().isBlank()) {
            repayment.setStatus("draft");
        }
        if (repayment.getDate() == null) {
            repayment.setDate(LocalDate.now());
        }
        repayment.setId(null);
        return loanRepaymentRepository.save(repayment);
    }

    /**
     * 更新还款单（仅草稿可编辑）。
     *
     * @param id 还款单ID
     * @param updates 更新内容
     * @return 更新后的还款单
     */
    @Transactional
    public LoanRepayment update(Long id, LoanRepayment updates) {
        LoanRepayment existing = loanRepaymentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("还款单不存在: " + id));
        if (!"draft".equals(existing.getStatus())) {
            throw new RuntimeException("仅草稿状态可编辑");
        }
        validateBase(updates);
        existing.setLoanId(updates.getLoanId());
        existing.setAmount(updates.getAmount());
        existing.setNote(updates.getNote());
        existing.setDate(updates.getDate() != null ? updates.getDate() : existing.getDate());
        return loanRepaymentRepository.save(existing);
    }

    /**
     * 提交还款单（草稿 -> submitted）。
     *
     * @param id 还款单ID
     * @return 更新后的还款单
     */
    @Transactional
    public LoanRepayment submit(Long id) {
        LoanRepayment existing = loanRepaymentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("还款单不存在: " + id));
        if (!"draft".equals(existing.getStatus())) {
            throw new RuntimeException("仅草稿状态可提交");
        }
        existing.setStatus("submitted");
        LoanRepayment saved = loanRepaymentRepository.save(existing);
        workflowNotifyService.notifySubmitted(
            "还款单",
            saved.getId(),
            saved.getCreator(),
            "金额: " + saved.getAmount()
        );
        return saved;
    }

    /**
     * 审批还款单（submitted -> approved/rejected）。
     *
     * @param id 还款单ID
     * @param approver 审批人
     * @param approved 是否通过
     * @param approvalNote 审批意见
     * @return 更新后的还款单
     */
    @Transactional
    public LoanRepayment approve(Long id, String approver, boolean approved, String approvalNote) {
        LoanRepayment existing = loanRepaymentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("还款单不存在: " + id));
        if (!"submitted".equals(existing.getStatus())) {
            throw new RuntimeException("仅提交状态可审批");
        }
        existing.setStatus(approved ? "approved" : "rejected");
        existing.setApprover(approver);
        existing.setApprovalDate(LocalDate.now());
        existing.setApprovalNote(approvalNote != null ? approvalNote : "");
        LoanRepayment saved = loanRepaymentRepository.save(existing);
        if (approved) {
            autoCollectDocument(saved);
        }
        workflowNotifyService.notifyApprovalResult("还款单", saved.getId(), approved, approver);
        return saved;
    }

    /**
     * 删除还款单（已通过不可删）。
     *
     * @param id 还款单ID
     */
    @Transactional
    public void delete(Long id) {
        LoanRepayment existing = loanRepaymentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("还款单不存在: " + id));
        if ("approved".equals(existing.getStatus())) {
            throw new RuntimeException("已通过还款单不可删除");
        }
        loanRepaymentRepository.deleteById(id);
    }

    /**
     * 汇总借款单已通过还款金额。
     *
     * @param loanId 借款单ID
     * @return 已还金额
     */
    public BigDecimal sumApprovedByLoanId(Long loanId) {
        BigDecimal sum = loanRepaymentRepository.sumApprovedByLoanId(loanId);
        return sum != null ? sum : BigDecimal.ZERO;
    }

    private void validateBase(LoanRepayment repayment) {
        if (repayment.getLoanId() == null) {
            throw new RuntimeException("还款单必须关联借款单");
        }
        Loan loan = loanRepository.findById(repayment.getLoanId())
            .orElseThrow(() -> new RuntimeException("借款单不存在: " + repayment.getLoanId()));
        if (!"approved".equals(loan.getStatus())) {
            throw new RuntimeException("仅已通过借款单允许登记还款");
        }
        if (repayment.getAmount() == null || repayment.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("还款金额必须大于0");
        }
        BigDecimal repaid = sumApprovedByLoanId(loan.getId());
        BigDecimal outstanding = loan.getAmount().subtract(repaid);
        if (repayment.getAmount().compareTo(outstanding) > 0) {
            throw new RuntimeException("还款金额不可超过剩余未还金额: " + outstanding);
        }
        if (repayment.getCreator() == null || repayment.getCreator().isBlank()) {
            repayment.setCreator(loan.getBorrower());
        }
    }

    private void autoCollectDocument(LoanRepayment repayment) {
        Loan loan = loanRepository.findById(repayment.getLoanId()).orElse(null);
        if (loan == null || loan.getProjectId() == null) {
            return;
        }
        String link = "/loan-repayments/" + repayment.getId();
        String remark = "还款审批通过，金额: " + repayment.getAmount() + "，借款单: #" + repayment.getLoanId();
        projectDocumentAutoCollectService.collect(
            loan.getProjectId(),
            "loan_repayment",
            "还款单 #" + repayment.getId(),
            link,
            remark
        );
    }
}
