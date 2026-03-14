package com.hongshuo.erp.model.dto;

import java.math.BigDecimal;

/**
 * 经营看板汇总DTO。
 */
public record OperationDashboardDto(
    BigDecimal contractSignedAmount,
    BigDecimal contractSettledAmount,
    BigDecimal approvedIncomeAmount,
    BigDecimal approvedExpenseAmount,
    BigDecimal upcomingReceivableAmount,
    BigDecimal overdueReceivableAmount,
    long upcomingReceivableCount,
    long overBudgetProjectCount
) {}
