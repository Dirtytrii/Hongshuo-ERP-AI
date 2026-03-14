package com.hongshuo.erp.service;

import com.hongshuo.erp.model.Contract;
import com.hongshuo.erp.model.FinanceRecord;
import com.hongshuo.erp.model.PaymentPlanItem;
import com.hongshuo.erp.model.Project;
import com.hongshuo.erp.model.dto.BudgetExecutionItemDto;
import com.hongshuo.erp.model.dto.OperationDashboardDto;
import com.hongshuo.erp.repository.ContractRepository;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import com.hongshuo.erp.repository.PaymentPlanItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {
    @Mock
    private ProjectService projectService;
    @Mock
    private ContractRepository contractRepository;
    @Mock
    private FinanceRecordRepository financeRecordRepository;
    @Mock
    private PaymentPlanItemRepository paymentPlanItemRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    void getOperationSummary_returnsAggregatedValues() {
        Contract c1 = new Contract();
        c1.setContractAmount(BigDecimal.valueOf(1000));
        Contract c2 = new Contract();
        c2.setContractAmount(BigDecimal.valueOf(500));
        when(contractRepository.findAll()).thenReturn(List.of(c1, c2));
        when(contractRepository.sumContractAmountBySettlementStatus("settled")).thenReturn(BigDecimal.valueOf(700));

        when(financeRecordRepository.sumApprovedAmountByType(FinanceRecord.FinanceType.income)).thenReturn(BigDecimal.valueOf(900));
        when(financeRecordRepository.sumApprovedAmountByType(FinanceRecord.FinanceType.expense)).thenReturn(BigDecimal.valueOf(400));

        PaymentPlanItem upcoming = new PaymentPlanItem();
        upcoming.setId(1L);
        upcoming.setPlanAmount(BigDecimal.valueOf(300));
        upcoming.setReceivedAmount(BigDecimal.valueOf(100));
        when(paymentPlanItemRepository.findUpcoming(any(LocalDate.class), any(LocalDate.class))).thenReturn(List.of(upcoming));
        when(financeRecordRepository.sumApprovedIncomeByPaymentPlanItemId(1L)).thenReturn(BigDecimal.valueOf(120));

        PaymentPlanItem overdue = new PaymentPlanItem();
        overdue.setId(2L);
        overdue.setPlanAmount(BigDecimal.valueOf(500));
        overdue.setReceivedAmount(BigDecimal.valueOf(200));
        when(paymentPlanItemRepository.findByPlanDateBeforeOrderByPlanDateAsc(any(LocalDate.class))).thenReturn(List.of(overdue));
        when(financeRecordRepository.sumApprovedIncomeByPaymentPlanItemId(2L)).thenReturn(BigDecimal.valueOf(250));

        Project p = createProject(10L, "P1");
        p.setTotalBudget(BigDecimal.valueOf(100));
        p.setActualCostTotal(BigDecimal.valueOf(120));
        p.setBudgetAlertStatus("red");
        when(projectService.getAllProjects()).thenReturn(List.of(p));
        doAnswer(inv -> inv.getArgument(0)).when(projectService).enrichWithCostSummary(any(Project.class));

        OperationDashboardDto dto = dashboardService.getOperationSummary(15);

        assertThat(dto.contractSignedAmount()).isEqualByComparingTo("1500");
        assertThat(dto.contractSettledAmount()).isEqualByComparingTo("700");
        assertThat(dto.approvedIncomeAmount()).isEqualByComparingTo("900");
        assertThat(dto.approvedExpenseAmount()).isEqualByComparingTo("400");
        assertThat(dto.upcomingReceivableAmount()).isEqualByComparingTo("180");
        assertThat(dto.overdueReceivableAmount()).isEqualByComparingTo("250");
        assertThat(dto.upcomingReceivableCount()).isEqualTo(1L);
        assertThat(dto.overBudgetProjectCount()).isEqualTo(1L);
    }

    @Test
    void getBudgetExecutionBoard_returnsProjectRows() {
        Project p = createProject(99L, "预算测试项目");
        p.setTotalBudget(BigDecimal.valueOf(1000));
        p.setActualCostTotal(BigDecimal.valueOf(750));
        p.setBudgetRatio(BigDecimal.valueOf(0.75));
        p.setBudgetAlertStatus("green");
        when(projectService.getAllProjects()).thenReturn(List.of(p));
        doAnswer(inv -> inv.getArgument(0)).when(projectService).enrichWithCostSummary(any(Project.class));

        List<BudgetExecutionItemDto> rows = dashboardService.getBudgetExecutionBoard();

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).projectId()).isEqualTo(99L);
        assertThat(rows.get(0).projectName()).isEqualTo("预算测试项目");
        assertThat(rows.get(0).totalBudget()).isEqualByComparingTo("1000");
        assertThat(rows.get(0).actualCostTotal()).isEqualByComparingTo("750");
        assertThat(rows.get(0).budgetRatio()).isEqualByComparingTo("0.75");
        assertThat(rows.get(0).budgetAlertStatus()).isEqualTo("green");
    }

    private static Project createProject(Long id, String name) {
        Project p = new Project();
        p.setId(id);
        p.setName(name);
        return p;
    }
}
