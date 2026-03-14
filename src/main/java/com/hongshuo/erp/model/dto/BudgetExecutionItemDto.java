package com.hongshuo.erp.model.dto;

import java.math.BigDecimal;

/**
 * 预算执行看板行DTO。
 */
public record BudgetExecutionItemDto(
    Long projectId,
    String projectName,
    BigDecimal totalBudget,
    BigDecimal actualCostTotal,
    BigDecimal budgetRatio,
    String budgetAlertStatus
) {}
