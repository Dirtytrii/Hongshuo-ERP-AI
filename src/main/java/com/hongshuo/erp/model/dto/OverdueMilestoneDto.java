package com.hongshuo.erp.model.dto;

import java.time.LocalDate;

/**
 * 超期里程碑 DTO，供仪表盘「里程碑超期预警」展示。
 */
public record OverdueMilestoneDto(
    Long id,
    String name,
    LocalDate planDate,
    String status,
    Long projectId,
    String projectName
) {}
