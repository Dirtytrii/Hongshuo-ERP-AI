package com.hongshuo.erp.service;

import com.hongshuo.erp.model.Loan;
import com.hongshuo.erp.repository.DepartmentRepository;
import com.hongshuo.erp.repository.LoanRepository;
import com.hongshuo.erp.repository.ProjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanRepository loanRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private LoanRepaymentService loanRepaymentService;
    @Mock
    private ProjectDocumentAutoCollectService projectDocumentAutoCollectService;
    @Mock
    private WorkflowNotifyService workflowNotifyService;

    @InjectMocks
    private LoanService loanService;

    @Test
    void getOutstandingAmount_shouldSubtractApprovedRepayment() {
        Loan loan = new Loan();
        loan.setId(1L);
        loan.setStatus("approved");
        loan.setAmount(new BigDecimal("5000.00"));
        when(loanRepository.findById(1L)).thenReturn(Optional.of(loan));
        when(loanRepaymentService.sumApprovedByLoanId(1L)).thenReturn(new BigDecimal("1200.00"));

        BigDecimal outstanding = loanService.getOutstandingAmount(1L);
        assertThat(outstanding).isEqualByComparingTo("3800.00");
    }

    @Test
    void getOutstandingAmount_shouldReturnZeroWhenLoanNotApproved() {
        Loan loan = new Loan();
        loan.setId(2L);
        loan.setStatus("draft");
        loan.setAmount(new BigDecimal("5000.00"));
        when(loanRepository.findById(2L)).thenReturn(Optional.of(loan));

        BigDecimal outstanding = loanService.getOutstandingAmount(2L);
        assertThat(outstanding).isEqualByComparingTo("0");
    }
}
