package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.dto.ApprovalTodoItemDto;
import com.hongshuo.erp.model.dto.MobileOverviewDto;
import com.hongshuo.erp.model.dto.OperationDashboardDto;
import com.hongshuo.erp.service.ApprovalCenterService;
import com.hongshuo.erp.service.ConfigFileService;
import com.hongshuo.erp.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mobile")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(name = "Mobile", description = "轻量移动端接口")
public class MobileController {
    private final DashboardService dashboardService;
    private final ApprovalCenterService approvalCenterService;
    private final ConfigFileService configFileService;

    @GetMapping("/overview")
    @Operation(summary = "移动端总览")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(schema = @Schema(implementation = MobileOverviewDto.class))),
        @ApiResponse(responseCode = "403", description = "移动端接口已禁用")
    })
    public ResponseEntity<?> overview() {
        if (!isMobileEnabled()) {
            return ResponseEntity.status(403).body(Map.of("error", "移动端接口已禁用"));
        }
        OperationDashboardDto dto = dashboardService.getOperationSummary(15);
        MobileOverviewDto result = new MobileOverviewDto(
            dto.contractSignedAmount(),
            dto.approvedIncomeAmount(),
            dto.approvedExpenseAmount(),
            dto.overdueReceivableAmount(),
            dto.overBudgetProjectCount(),
            approvalCenterService.pendingCount(),
            LocalDateTime.now()
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/todos")
    @Operation(summary = "移动端待办")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(
            mediaType = "application/json",
            array = @ArraySchema(schema = @Schema(implementation = ApprovalTodoItemDto.class))
        )),
        @ApiResponse(responseCode = "403", description = "移动端接口已禁用")
    })
    public ResponseEntity<?> todos() {
        if (!isMobileEnabled()) {
            return ResponseEntity.status(403).body(Map.of("error", "移动端接口已禁用"));
        }
        List<ApprovalTodoItemDto> list = approvalCenterService.listTodos();
        return ResponseEntity.ok(list);
    }

    private boolean isMobileEnabled() {
        return Boolean.parseBoolean(configFileService.get("integration.mobile.enabled", "true"));
    }
}
