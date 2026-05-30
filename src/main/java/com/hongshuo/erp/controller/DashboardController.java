package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.dto.BudgetExecutionItemDto;
import com.hongshuo.erp.model.dto.OperationDashboardDto;
import com.hongshuo.erp.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard", description = "经营看板与预算执行看板")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;

    @GetMapping("/operation")
    @Operation(summary = "经营看板汇总")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = OperationDashboardDto.class)))
    })
    public ResponseEntity<OperationDashboardDto> getOperationSummary(
            @Parameter(description = "近期待催款统计窗口天数", example = "15")
            @RequestParam(defaultValue = "15") int days) {
        return ResponseEntity.ok(dashboardService.getOperationSummary(days));
    }

    @GetMapping("/budget-execution")
    @Operation(summary = "预算执行看板明细")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(
            mediaType = "application/json",
            array = @ArraySchema(schema = @Schema(implementation = BudgetExecutionItemDto.class))
        ))
    })
    public ResponseEntity<List<BudgetExecutionItemDto>> getBudgetExecutionBoard() {
        return ResponseEntity.ok(dashboardService.getBudgetExecutionBoard());
    }
}
