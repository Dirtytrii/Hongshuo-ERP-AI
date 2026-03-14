package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.LoanRepayment;
import com.hongshuo.erp.service.LoanRepaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loan-repayments")
@CrossOrigin(origins = "*")
@Tag(name = "LoanRepayments", description = "还款单与审批")
@RequiredArgsConstructor
public class LoanRepaymentController {
    private final LoanRepaymentService loanRepaymentService;

    @GetMapping
    @Operation(summary = "获取还款单列表")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(
            mediaType = "application/json",
            array = @ArraySchema(schema = @Schema(implementation = LoanRepayment.class))
        ))
    })
    public ResponseEntity<List<LoanRepayment>> list(
            @RequestParam(required = false) Long loanId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(loanRepaymentService.findAll(loanId, status));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取还款单详情")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功"),
        @ApiResponse(responseCode = "404", description = "不存在")
    })
    public ResponseEntity<LoanRepayment> getById(@Parameter(description = "还款单ID") @PathVariable Long id) {
        return loanRepaymentService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "创建还款单")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "创建成功"),
        @ApiResponse(responseCode = "400", description = "参数错误")
    })
    public ResponseEntity<?> create(@RequestBody LoanRepayment repayment) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(loanRepaymentService.create(repayment));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新还款单")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "更新成功"),
        @ApiResponse(responseCode = "404", description = "不存在"),
        @ApiResponse(responseCode = "400", description = "参数错误")
    })
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody LoanRepayment repayment) {
        try {
            return ResponseEntity.ok(loanRepaymentService.update(id, repayment));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("不存在")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "提交还款单")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "提交成功"),
        @ApiResponse(responseCode = "400", description = "状态不允许")
    })
    public ResponseEntity<?> submit(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(loanRepaymentService.submit(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "审批还款单")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "审批成功"),
        @ApiResponse(responseCode = "400", description = "状态不允许")
    })
    public ResponseEntity<?> approve(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            String approver = body.get("approver") != null ? body.get("approver").toString() : "system";
            boolean approved = Boolean.parseBoolean(String.valueOf(body.get("approved")));
            String note = body.get("approvalNote") != null ? body.get("approvalNote").toString() : "";
            return ResponseEntity.ok(loanRepaymentService.approve(id, approver, approved, note));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除还款单")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "不存在"),
        @ApiResponse(responseCode = "400", description = "状态不允许")
    })
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            loanRepaymentService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("不存在")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
