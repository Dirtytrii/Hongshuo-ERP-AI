package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.PaymentPlanItem;
import com.hongshuo.erp.service.PaymentPlanService;
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

@RestController
@RequestMapping("/api/payment-plans")
@Tag(name = "PaymentPlans", description = "回款计划与待催款预警")
public class PaymentPlanController {

    @Autowired
    private PaymentPlanService paymentPlanService;

    @GetMapping("/upcoming")
    @Operation(summary = "近期待催款", description = "返回未来 N 天内计划收款未收齐的节点，供仪表盘预警。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(
            mediaType = "application/json",
            array = @ArraySchema(schema = @Schema(implementation = PaymentPlanItem.class))
        ))
    })
    public ResponseEntity<List<PaymentPlanItem>> getUpcoming(
            @Parameter(description = "未来天数", example = "15")
            @RequestParam(defaultValue = "15") int days) {
        return ResponseEntity.ok(paymentPlanService.getUpcoming(days));
    }

    @GetMapping
    @Operation(summary = "按项目获取回款计划列表", description = "根据项目ID查询该项目的全部回款计划节点。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(
            mediaType = "application/json",
            array = @ArraySchema(schema = @Schema(implementation = PaymentPlanItem.class))
        ))
    })
    public ResponseEntity<List<PaymentPlanItem>> getByProjectId(
            @Parameter(description = "项目ID", required = true)
            @RequestParam Long projectId) {
        return ResponseEntity.ok(paymentPlanService.getByProjectId(projectId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取回款计划详情", description = "根据ID查询单条回款计划。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = PaymentPlanItem.class))),
        @ApiResponse(responseCode = "404", description = "不存在")
    })
    public ResponseEntity<PaymentPlanItem> getById(
            @Parameter(description = "回款计划ID")
            @PathVariable Long id) {
        PaymentPlanItem item = paymentPlanService.getById(id);
        return item != null ? ResponseEntity.ok(item) : ResponseEntity.notFound().build();
    }

    @PostMapping
    @Operation(summary = "新增回款计划节点", description = "为指定项目新增一条回款计划。")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "创建成功",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = PaymentPlanItem.class))),
        @ApiResponse(responseCode = "400", description = "参数错误")
    })
    public ResponseEntity<?> create(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "回款计划：name(节点名称)、planDate、planAmount、receivedAmount(可选)、status(可选)",
                required = true
            )
            @RequestBody PaymentPlanItem item,
            @RequestParam Long projectId) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentPlanService.create(projectId, item));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新回款计划", description = "更新指定回款计划节点。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "更新成功",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = PaymentPlanItem.class))),
        @ApiResponse(responseCode = "400", description = "参数错误"),
        @ApiResponse(responseCode = "404", description = "不存在")
    })
    public ResponseEntity<?> update(
            @Parameter(description = "回款计划ID")
            @PathVariable Long id,
            @RequestBody PaymentPlanItem item) {
        try {
            return ResponseEntity.ok(paymentPlanService.update(id, item));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("不存在")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除回款计划", description = "删除指定回款计划节点。")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "不存在")
    })
    public ResponseEntity<?> delete(
            @Parameter(description = "回款计划ID")
            @PathVariable Long id) {
        try {
            paymentPlanService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("不存在")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }
}
