package com.hongshuo.erp.model.dto;

import java.math.BigDecimal;

/**
 * 审批中心待办项。
 */
public record ApprovalTodoItemDto(
    String bizType,
    Long bizId,
    String title,
    String applicant,
    BigDecimal amount,
    String status,
    String date,
    Long projectId
) {}
