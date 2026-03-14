package com.hongshuo.erp.service;

import com.hongshuo.erp.model.Department;
import com.hongshuo.erp.model.dto.DepartmentCostSummaryDto;
import com.hongshuo.erp.repository.DepartmentRepository;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import com.hongshuo.erp.repository.LoanRepository;
import com.hongshuo.erp.repository.ReimbursementRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DepartmentServiceTest {

    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private FinanceRecordRepository financeRecordRepository;
    @Mock
    private ReimbursementRepository reimbursementRepository;
    @Mock
    private LoanRepository loanRepository;

    @InjectMocks
    private DepartmentService departmentService;

    @Test
    void getCostSummary_shouldAggregateThreeSources() {
        Department dep = new Department();
        dep.setId(100L);
        dep.setName("工程部");
        dep.setCode("ENG");
        when(departmentRepository.findAll()).thenReturn(List.of(dep));
        when(financeRecordRepository.sumApprovedExpenseByDepartmentId(100L)).thenReturn(new BigDecimal("300"));
        when(reimbursementRepository.sumApprovedByDepartmentId(100L)).thenReturn(new BigDecimal("200"));
        when(loanRepository.sumApprovedByDepartmentId(100L)).thenReturn(new BigDecimal("100"));

        List<DepartmentCostSummaryDto> result = departmentService.getCostSummary();

        assertThat(result).hasSize(1);
        DepartmentCostSummaryDto row = result.get(0);
        assertThat(row.departmentName()).isEqualTo("工程部");
        assertThat(row.totalAmount()).isEqualByComparingTo("600");
    }
}
