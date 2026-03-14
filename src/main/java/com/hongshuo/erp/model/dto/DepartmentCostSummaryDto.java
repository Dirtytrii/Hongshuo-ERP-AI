package com.hongshuo.erp.model.dto;

import java.math.BigDecimal;

/**
 * 部门成本汇总DTO。
 */
public record DepartmentCostSummaryDto(
    Long departmentId,
    String departmentName,
    BigDecimal financeExpenseAmount,
    BigDecimal reimbursementAmount,
    BigDecimal loanAmount,
    BigDecimal totalAmount
) {}
