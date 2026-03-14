package com.hongshuo.erp.model.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 轻量移动端总览数据。
 */
public record MobileOverviewDto(
    BigDecimal contractSignedAmount,
    BigDecimal approvedIncomeAmount,
    BigDecimal approvedExpenseAmount,
    BigDecimal overdueReceivableAmount,
    long overBudgetProjectCount,
    int pendingApprovalCount,
    LocalDateTime generatedAt
) {}
