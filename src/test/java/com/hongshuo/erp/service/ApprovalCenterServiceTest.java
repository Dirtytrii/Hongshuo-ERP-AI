package com.hongshuo.erp.service;

import com.hongshuo.erp.model.ChangeOrder;
import com.hongshuo.erp.model.FinanceRecord;
import com.hongshuo.erp.model.Loan;
import com.hongshuo.erp.model.LoanRepayment;
import com.hongshuo.erp.model.Reimbursement;
import com.hongshuo.erp.model.dto.ApprovalTodoItemDto;
import com.hongshuo.erp.repository.ChangeOrderRepository;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import com.hongshuo.erp.repository.LoanRepaymentRepository;
import com.hongshuo.erp.repository.LoanRepository;
import com.hongshuo.erp.repository.ReimbursementRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApprovalCenterServiceTest {

    @Mock
    private FinanceRecordRepository financeRecordRepository;
    @Mock
    private ChangeOrderRepository changeOrderRepository;
    @Mock
    private ReimbursementRepository reimbursementRepository;
    @Mock
    private LoanRepository loanRepository;
    @Mock
    private LoanRepaymentRepository loanRepaymentRepository;

    @InjectMocks
    private ApprovalCenterService approvalCenterService;

    @Test
    void listTodos_shouldAggregateAllSubmittedAndPendingForms() {
        FinanceRecord finance = new FinanceRecord();
        finance.setId(1L);
        finance.setStatus("pending");
        finance.setCreator("financeUser");
        finance.setAmount(new BigDecimal("500"));
        finance.setDate(LocalDate.now());
        finance.setCategory("材料费");
        finance.setType(FinanceRecord.FinanceType.expense);

        ChangeOrder changeOrder = new ChangeOrder();
        changeOrder.setId(2L);
        changeOrder.setStatus("pending");
        changeOrder.setAmount(new BigDecimal("1000"));
        changeOrder.setCreatedAt(LocalDateTime.now());
        changeOrder.setProjectId(10L);

        Reimbursement reimbursement = new Reimbursement();
        reimbursement.setId(3L);
        reimbursement.setStatus("submitted");
        reimbursement.setApplicant("alice");
        reimbursement.setAmount(new BigDecimal("200"));
        reimbursement.setDate(LocalDate.now());

        Loan loan = new Loan();
        loan.setId(4L);
        loan.setStatus("submitted");
        loan.setBorrower("bob");
        loan.setAmount(new BigDecimal("900"));
        loan.setDate(LocalDate.now());

        LoanRepayment repayment = new LoanRepayment();
        repayment.setId(5L);
        repayment.setStatus("submitted");
        repayment.setCreator("bob");
        repayment.setAmount(new BigDecimal("300"));
        repayment.setDate(LocalDate.now());

        when(financeRecordRepository.findByStatus("pending")).thenReturn(List.of(finance));
        when(changeOrderRepository.findByStatus("pending")).thenReturn(List.of(changeOrder));
        when(reimbursementRepository.findByStatusOrderByDateDesc("submitted")).thenReturn(List.of(reimbursement));
        when(loanRepository.findByStatusOrderByDateDesc("submitted")).thenReturn(List.of(loan));
        when(loanRepaymentRepository.findByStatusOrderByDateDesc("submitted")).thenReturn(List.of(repayment));

        List<ApprovalTodoItemDto> todos = approvalCenterService.listTodos();

        assertThat(todos).hasSize(5);
        assertThat(approvalCenterService.pendingCount()).isEqualTo(5);
        assertThat(todos.stream().map(ApprovalTodoItemDto::bizType)).contains(
            "finance", "change_order", "reimbursement", "loan", "loan_repayment"
        );
    }
}
