package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.Supplier;
import com.hongshuo.erp.service.SupplierService;
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
@RequestMapping("/api/suppliers")
@Tag(name = "Suppliers", description = "供应商主数据与应付/已付/欠款")
public class SupplierController {

    @Autowired
    private SupplierService supplierService;

    @GetMapping
    @Operation(summary = "获取供应商列表", description = "返回全部供应商，按名称排序，供下拉与列表使用。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(
            mediaType = "application/json",
            array = @ArraySchema(schema = @Schema(implementation = Supplier.class))
        ))
    })
    public ResponseEntity<List<Supplier>> list() {
        return ResponseEntity.ok(supplierService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取供应商详情", description = "根据ID查询单条供应商。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Supplier.class))),
        @ApiResponse(responseCode = "404", description = "不存在")
    })
    public ResponseEntity<Supplier> getById(
            @Parameter(description = "供应商ID") @PathVariable Long id) {
        return supplierService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "新增供应商", description = "创建供应商主数据。")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "创建成功",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Supplier.class))),
        @ApiResponse(responseCode = "400", description = "参数错误")
    })
    public ResponseEntity<?> create(@RequestBody Supplier supplier) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.create(supplier));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新供应商", description = "更新指定供应商。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "更新成功",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Supplier.class))),
        @ApiResponse(responseCode = "400", description = "参数错误"),
        @ApiResponse(responseCode = "404", description = "不存在")
    })
    public ResponseEntity<?> update(
            @Parameter(description = "供应商ID") @PathVariable Long id,
            @RequestBody Supplier supplier) {
        try {
            return ResponseEntity.ok(supplierService.update(id, supplier));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("不存在")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除供应商", description = "删除指定供应商。")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "不存在")
    })
    public ResponseEntity<?> delete(
            @Parameter(description = "供应商ID") @PathVariable Long id) {
        try {
            supplierService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("不存在")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/balance")
    @Operation(summary = "单个供应商应付/已付/欠款", description = "返回该供应商的应付、已付、欠款汇总。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(mediaType = "application/json")),
        @ApiResponse(responseCode = "404", description = "供应商不存在")
    })
    public ResponseEntity<?> getBalance(
            @Parameter(description = "供应商ID") @PathVariable Long id) {
        try {
            return ResponseEntity.ok(supplierService.getBalance(id));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("不存在")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/reports/balance")
    @Operation(summary = "供应商应付/已付/欠款报表", description = "按供应商汇总应付、已付、欠款列表，可配合 format=list 使用。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<List<Map<String, Object>>> getSupplierBalanceList(
            @Parameter(description = "可选，list 返回列表") @RequestParam(required = false) String format) {
        return ResponseEntity.ok(supplierService.getSupplierBalanceList());
    }
}
