package com.hongshuo.erp.service;

import com.hongshuo.erp.model.dto.ApprovalTodoItemDto;
import com.hongshuo.erp.repository.ChangeOrderRepository;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import com.hongshuo.erp.repository.LoanRepaymentRepository;
import com.hongshuo.erp.repository.LoanRepository;
import com.hongshuo.erp.repository.ReimbursementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * 审批中心聚合服务（待办列表）。
 */
@Service
@RequiredArgsConstructor
public class ApprovalCenterService {
    private final FinanceRecordRepository financeRecordRepository;
    private final ChangeOrderRepository changeOrderRepository;
    private final ReimbursementRepository reimbursementRepository;
    private final LoanRepository loanRepository;
    private final LoanRepaymentRepository loanRepaymentRepository;

    /**
     * 查询审批中心待办。
     *
     * @return 待办列表（按日期倒序）
     */
    public List<ApprovalTodoItemDto> listTodos() {
        List<ApprovalTodoItemDto> list = new ArrayList<>();

        financeRecordRepository.findByStatus("pending").forEach(item -> list.add(new ApprovalTodoItemDto(
            "finance",
            item.getId(),
            "财务" + (item.getType() == null ? "" : (item.getType().name().equalsIgnoreCase("income") ? "收入" : "支出")) + "审批",
            item.getCreator(),
            nullToZero(item.getAmount()),
            item.getStatus(),
            item.getDate() != null ? item.getDate().toString() : "",
            item.getProjectId()
        )));

        changeOrderRepository.findByStatus("pending").forEach(item -> list.add(new ApprovalTodoItemDto(
            "change_order",
            item.getId(),
            "变更单审批",
            item.getApprover() != null ? item.getApprover() : "未指定",
            nullToZero(item.getAmount()),
            item.getStatus(),
            item.getCreatedAt() != null ? item.getCreatedAt().toLocalDate().toString() : "",
            item.getProjectId()
        )));

        reimbursementRepository.findByStatusOrderByDateDesc("submitted").forEach(item -> list.add(new ApprovalTodoItemDto(
            "reimbursement",
            item.getId(),
            "报销单审批",
            item.getApplicant(),
            nullToZero(item.getAmount()),
            item.getStatus(),
            item.getDate() != null ? item.getDate().toString() : "",
            item.getProjectId()
        )));

        loanRepository.findByStatusOrderByDateDesc("submitted").forEach(item -> list.add(new ApprovalTodoItemDto(
            "loan",
            item.getId(),
            "借款单审批",
            item.getBorrower(),
            nullToZero(item.getAmount()),
            item.getStatus(),
            item.getDate() != null ? item.getDate().toString() : "",
            item.getProjectId()
        )));

        loanRepaymentRepository.findByStatusOrderByDateDesc("submitted").forEach(item -> list.add(new ApprovalTodoItemDto(
            "loan_repayment",
            item.getId(),
            "还款单审批",
            item.getCreator(),
            nullToZero(item.getAmount()),
            item.getStatus(),
            item.getDate() != null ? item.getDate().toString() : "",
            null
        )));

        return list.stream()
            .sorted(Comparator.comparing(ApprovalTodoItemDto::date, Comparator.nullsLast(String::compareTo)).reversed())
            .toList();
    }

    /**
     * 查询待办总数。
     *
     * @return 待办数量
     */
    public int pendingCount() {
        return listTodos().size();
    }

    private static BigDecimal nullToZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
