package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.dto.ApprovalTodoItemDto;
import com.hongshuo.erp.service.ApprovalCenterService;
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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/approval-center")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(name = "ApprovalCenter", description = "审批中心待办聚合")
public class ApprovalCenterController {
    private final ApprovalCenterService approvalCenterService;

    @GetMapping("/todos")
    @Operation(summary = "获取审批待办列表")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(
            mediaType = "application/json",
            array = @ArraySchema(schema = @Schema(implementation = ApprovalTodoItemDto.class))
        ))
    })
    public ResponseEntity<List<ApprovalTodoItemDto>> listTodos() {
        return ResponseEntity.ok(approvalCenterService.listTodos());
    }

    @GetMapping("/summary")
    @Operation(summary = "获取审批待办汇总")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功")
    })
    public ResponseEntity<Map<String, Object>> summary() {
        return ResponseEntity.ok(Map.of("pendingCount", approvalCenterService.pendingCount()));
    }
}
