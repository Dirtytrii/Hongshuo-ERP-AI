package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.ChangeOrder;
import com.hongshuo.erp.service.ChangeOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/change-orders")
@Tag(name = "ChangeOrders", description = "变更/签证单与审批")
public class ChangeOrderController {

    @Autowired
    private ChangeOrderService changeOrderService;

    @GetMapping
    @Operation(summary = "获取变更单列表", description = "支持按 projectId、status 筛选。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(
            mediaType = "application/json",
            array = @ArraySchema(schema = @Schema(implementation = ChangeOrder.class))
        ))
    })
    public ResponseEntity<List<ChangeOrder>> list(
            @Parameter(description = "项目ID") @RequestParam(required = false) Long projectId,
            @Parameter(description = "状态") @RequestParam(required = false) String status) {
        if (projectId != null) {
            return ResponseEntity.ok(changeOrderService.findByProjectId(projectId));
        }
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(changeOrderService.findAll().stream()
                .filter(o -> status.equals(o.getStatus()))
                .toList());
        }
        return ResponseEntity.ok(changeOrderService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取变更单详情")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ChangeOrder.class))),
        @ApiResponse(responseCode = "404", description = "不存在")
    })
    public ResponseEntity<ChangeOrder> getById(
            @Parameter(description = "变更单ID") @PathVariable Long id) {
        return changeOrderService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "新增变更单")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "创建成功",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ChangeOrder.class))),
        @ApiResponse(responseCode = "400", description = "参数错误")
    })
    public ResponseEntity<?> create(@RequestBody ChangeOrder order) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(changeOrderService.create(order));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新变更单", description = "仅待审批状态可更新。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "更新成功",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ChangeOrder.class))),
        @ApiResponse(responseCode = "400", description = "参数错误或状态不允许"),
        @ApiResponse(responseCode = "404", description = "不存在")
    })
    public ResponseEntity<?> update(
            @Parameter(description = "变更单ID") @PathVariable Long id,
            @RequestBody ChangeOrder order) {
        try {
            return ResponseEntity.ok(changeOrderService.update(id, order));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("不存在")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除变更单", description = "仅待审批状态可删除。")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "400", description = "已审批不可删除"),
        @ApiResponse(responseCode = "404", description = "不存在")
    })
    public ResponseEntity<?> delete(
            @Parameter(description = "变更单ID") @PathVariable Long id) {
        try {
            changeOrderService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("不存在")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "审批变更单", description = "审批通过后会将变更金额追加到项目合同金额。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "审批成功",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ChangeOrder.class))),
        @ApiResponse(responseCode = "400", description = "状态不允许或业务错误")
    })
    public ResponseEntity<?> approve(
            @Parameter(description = "变更单ID") @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            String approver = (String) body.get("approver");
            boolean approved = Boolean.parseBoolean(String.valueOf(body.get("approved")));
            String note = body.get("approvalNote") != null ? body.get("approvalNote").toString() : "";
            return ResponseEntity.ok(changeOrderService.approve(id, approver, approved, note));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
