package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.Contract;
import com.hongshuo.erp.service.ContractService;
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
@RequestMapping("/api/contracts")
@Tag(name = "Contracts", description = "合同全生命周期管理")
@RequiredArgsConstructor
public class ContractController {
    private final ContractService contractService;

    @GetMapping
    @Operation(summary = "获取合同列表", description = "支持按项目、结算状态、监控状态筛选。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(
            mediaType = "application/json",
            array = @ArraySchema(schema = @Schema(implementation = Contract.class))
        ))
    })
    public ResponseEntity<List<Contract>> list(
            @Parameter(description = "项目ID") @RequestParam(required = false) Long projectId,
            @Parameter(description = "结算状态") @RequestParam(required = false) String settlementStatus,
            @Parameter(description = "监控状态") @RequestParam(required = false) String monitoringStatus) {
        return ResponseEntity.ok(contractService.findAll(projectId, settlementStatus, monitoringStatus));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取合同详情")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Contract.class))),
        @ApiResponse(responseCode = "404", description = "合同不存在")
    })
    public ResponseEntity<Contract> getById(
            @Parameter(description = "合同ID") @PathVariable Long id) {
        return contractService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "创建合同")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "创建成功",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Contract.class))),
        @ApiResponse(responseCode = "400", description = "参数错误")
    })
    public ResponseEntity<?> create(@RequestBody Contract contract) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(contractService.create(contract));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新合同")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "更新成功",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Contract.class))),
        @ApiResponse(responseCode = "400", description = "参数错误"),
        @ApiResponse(responseCode = "404", description = "合同不存在")
    })
    public ResponseEntity<?> update(
            @Parameter(description = "合同ID") @PathVariable Long id,
            @RequestBody Contract contract) {
        try {
            return ResponseEntity.ok(contractService.update(id, contract));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("不存在")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除合同")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "合同不存在")
    })
    public ResponseEntity<?> delete(
            @Parameter(description = "合同ID") @PathVariable Long id) {
        try {
            contractService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("不存在")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
