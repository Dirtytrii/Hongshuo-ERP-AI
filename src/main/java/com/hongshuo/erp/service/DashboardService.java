package com.hongshuo.erp.service;

import com.hongshuo.erp.model.FinanceRecord;
import com.hongshuo.erp.model.PaymentPlanItem;
import com.hongshuo.erp.model.Project;
import com.hongshuo.erp.model.dto.BudgetExecutionItemDto;
import com.hongshuo.erp.model.dto.OperationDashboardDto;
import com.hongshuo.erp.repository.ContractRepository;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import com.hongshuo.erp.repository.PaymentPlanItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final ProjectService projectService;
    private final ContractRepository contractRepository;
    private final FinanceRecordRepository financeRecordRepository;
    private final PaymentPlanItemRepository paymentPlanItemRepository;

    /**
     * 经营看板汇总。
     *
     * @param days 近期待催款窗口天数
     * @return 经营看板汇总数据
     */
    public OperationDashboardDto getOperationSummary(int days) {
        BigDecimal contractSignedAmount = nullToZero(contractRepository.findAll().stream()
            .map(c -> c.getContractAmount() != null ? c.getContractAmount() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add));
        BigDecimal contractSettledAmount = nullToZero(contractRepository.sumContractAmountBySettlementStatus("settled"));
        BigDecimal approvedIncomeAmount = nullToZero(
            financeRecordRepository.sumApprovedAmountByType(FinanceRecord.FinanceType.income)
        );
        BigDecimal approvedExpenseAmount = nullToZero(
            financeRecordRepository.sumApprovedAmountByType(FinanceRecord.FinanceType.expense)
        );

        LocalDate today = LocalDate.now();
        List<PaymentPlanItem> upcoming = paymentPlanItemRepository.findUpcoming(today, today.plusDays(Math.max(days, 1)));
        BigDecimal upcomingReceivableAmount = BigDecimal.ZERO;
        long upcomingReceivableCount = 0;
        for (PaymentPlanItem item : upcoming) {
            BigDecimal linkedIncome = financeRecordRepository.sumApprovedIncomeByPaymentPlanItemId(item.getId());
            BigDecimal received = max(
                nullToZero(item.getReceivedAmount()),
                nullToZero(linkedIncome)
            );
            BigDecimal planAmount = nullToZero(item.getPlanAmount());
            BigDecimal remain = planAmount.subtract(received);
            if (remain.compareTo(BigDecimal.ZERO) > 0) {
                upcomingReceivableAmount = upcomingReceivableAmount.add(remain);
                upcomingReceivableCount++;
            }
        }

        List<PaymentPlanItem> overdueAll = paymentPlanItemRepository.findByPlanDateBeforeOrderByPlanDateAsc(today);
        BigDecimal overdueReceivableAmount = BigDecimal.ZERO;
        for (PaymentPlanItem item : overdueAll) {
            BigDecimal linkedIncome = financeRecordRepository.sumApprovedIncomeByPaymentPlanItemId(item.getId());
            BigDecimal received = max(
                nullToZero(item.getReceivedAmount()),
                nullToZero(linkedIncome)
            );
            BigDecimal remain = nullToZero(item.getPlanAmount()).subtract(received);
            if (remain.compareTo(BigDecimal.ZERO) > 0) {
                overdueReceivableAmount = overdueReceivableAmount.add(remain);
            }
        }

        long overBudgetProjectCount = getBudgetExecutionBoard().stream()
            .filter(i -> "red".equals(i.budgetAlertStatus()))
            .count();

        return new OperationDashboardDto(
            contractSignedAmount,
            contractSettledAmount,
            approvedIncomeAmount,
            approvedExpenseAmount,
            upcomingReceivableAmount,
            overdueReceivableAmount,
            upcomingReceivableCount,
            overBudgetProjectCount
        );
    }

    /**
     * 预算执行看板列表：预算 vs 实际成本 vs 执行率。
     *
     * @return 预算执行明细
     */
    public List<BudgetExecutionItemDto> getBudgetExecutionBoard() {
        return projectService.getAllProjects().stream()
            .peek(projectService::enrichWithCostSummary)
            .map(this::toBudgetExecutionItem)
            .toList();
    }

    private BudgetExecutionItemDto toBudgetExecutionItem(Project project) {
        return new BudgetExecutionItemDto(
            project.getId(),
            project.getName(),
            project.getTotalBudget(),
            nullToZero(project.getActualCostTotal()),
            project.getBudgetRatio(),
            project.getBudgetAlertStatus()
        );
    }

    private static BigDecimal nullToZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private static BigDecimal max(BigDecimal a, BigDecimal b) {
        return a.compareTo(b) >= 0 ? a : b;
    }
}
