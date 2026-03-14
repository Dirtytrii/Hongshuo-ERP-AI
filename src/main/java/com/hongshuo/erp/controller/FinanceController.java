package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.FinanceRecord;
import com.hongshuo.erp.service.FinanceService;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance")
@CrossOrigin(origins = "*")
@Tag(name = "Finance", description = "财务收支与审批接口")
public class FinanceController {

    @Autowired
    private FinanceService financeService;

    @GetMapping
    @Operation(summary = "获取所有财务记录", description = "返回全部财务收支记录列表，用于报表与列表页加载。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(
            mediaType = "application/json",
            array = @ArraySchema(schema = @Schema(implementation = FinanceRecord.class))
        ))
    })
    public ResponseEntity<List<FinanceRecord>> getAllFinanceRecords() {
        return ResponseEntity.ok(financeService.getAllFinanceRecords());
    }

    @GetMapping("/pending")
    @Operation(summary = "获取待审批财务记录", description = "返回当前处于待审批状态的收入/支出记录列表。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(
            mediaType = "application/json",
            array = @ArraySchema(schema = @Schema(implementation = FinanceRecord.class))
        ))
    })
    public ResponseEntity<List<FinanceRecord>> getPendingFinanceRecords() {
        return ResponseEntity.ok(financeService.getPendingFinanceRecords());
    }

    @GetMapping("/categories")
    @Operation(summary = "获取支出类别枚举", description = "返回允许的支出类别及对应的成本类型(material/labor/other)，供前端下拉与校验。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(
            mediaType = "application/json",
            array = @ArraySchema(schema = @Schema(implementation = Map.class))
        ))
    })
    public ResponseEntity<List<Map<String, String>>> getCategories() {
        return ResponseEntity.ok(financeService.getExpenseCategories());
    }

    @GetMapping("/{id}")
    @Operation(summary = "根据ID获取财务记录", description = "按主键ID查询单条财务记录。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = FinanceRecord.class))),
        @ApiResponse(responseCode = "404", description = "记录不存在")
    })
    public ResponseEntity<FinanceRecord> getFinanceRecordById(
            @Parameter(description = "财务记录ID", example = "1")
            @PathVariable Long id) {
        return financeService.getFinanceRecordById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "按项目获取财务记录", description = "根据项目ID查询所有关联的收入/支出记录，用于项目详情页。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(
            mediaType = "application/json",
            array = @ArraySchema(schema = @Schema(implementation = FinanceRecord.class))
        ))
    })
    public ResponseEntity<List<FinanceRecord>> getFinanceRecordsByProjectId(
            @Parameter(description = "项目ID", example = "1001")
            @PathVariable Long projectId) {
        return ResponseEntity.ok(financeService.getFinanceRecordsByProjectId(projectId));
    }

    @PostMapping
    @Operation(
        summary = "创建财务记录",
        description = "根据请求体创建收入或支出记录：大额支出会进入待审批状态，小额支出与收入会直接生效，并在审批通过后回写到项目成本或已收款。"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "创建成功",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = FinanceRecord.class))),
        @ApiResponse(responseCode = "400", description = "参数错误或业务校验失败",
            content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<?> createFinanceRecord(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "财务记录创建参数：type(收入/支出)、category(类别)、amount(金额)、projectId(可选)、costType(材料/人工/其他)、description(备注)、creator(创建人角色或账号)",
                required = true
            )
            @RequestBody Map<String, Object> request) {
        try {
            // 先解析 creator 与冲销参数，避免普通字段缺失导致 NPE
            String creatorRole = request.get("creator") != null
                ? request.get("creator").toString()
                : "system";

            boolean isReversal = request.get("isReversal") != null && Boolean.parseBoolean(request.get("isReversal").toString());
            Object reversalOfObj = request.get("reversalOfId");
            if (isReversal && reversalOfObj != null && !reversalOfObj.toString().isBlank()) {
                Long reversalOfId = Long.valueOf(reversalOfObj.toString());
                String note = request.get("description") != null ? request.get("description").toString() : null;
                FinanceRecord reversal = financeService.createReversal(reversalOfId, note, creatorRole);
                return ResponseEntity.status(HttpStatus.CREATED).body(reversal);
            }

            // 普通收入/支出记录创建
            if (request.get("type") == null || request.get("category") == null || request.get("amount") == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "缺少必要字段：type/category/amount"));
            }

            FinanceRecord record = new FinanceRecord();
            record.setType(FinanceRecord.FinanceType.valueOf(request.get("type").toString()));
            record.setCategory(request.get("category").toString());
            record.setAmount(new BigDecimal(request.get("amount").toString()));
            if (request.get("costType") != null && !request.get("costType").toString().isBlank()) {
                record.setCostType(request.get("costType").toString().trim());
            }
            
            if (request.get("projectId") != null) {
                record.setProjectId(Long.valueOf(request.get("projectId").toString()));
            }
            if (request.get("paymentPlanItemId") != null && !request.get("paymentPlanItemId").toString().isBlank()) {
                record.setPaymentPlanItemId(Long.valueOf(request.get("paymentPlanItemId").toString()));
            }
            if (request.get("supplierId") != null && !request.get("supplierId").toString().isBlank()) {
                record.setSupplierId(Long.valueOf(request.get("supplierId").toString()));
            }
            if (request.get("departmentId") != null && !request.get("departmentId").toString().isBlank()) {
                record.setDepartmentId(Long.valueOf(request.get("departmentId").toString()));
            }

            if (request.get("description") != null) {
                record.setDescription(request.get("description").toString());
            }

            FinanceRecord saved = financeService.createFinanceRecord(record, creatorRole);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve")
    @Operation(
        summary = "审批财务记录",
        description = "管理员或有审批权限的角色对大额支出或收入进行审批。审批通过后会自动回写到项目材料/人工/其他成本或已收款字段；审批驳回则仅更新记录状态与审批意见。"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "审批成功",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = FinanceRecord.class))),
        @ApiResponse(responseCode = "400", description = "业务校验失败或记录状态不允许审批",
            content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<?> approveFinanceRecord(
            @Parameter(description = "财务记录ID", example = "1")
            @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "审批参数：approver(审批人角色或账号)、approved(是否通过)、approvalNote(审批意见，可选)",
                required = true
            )
            @RequestBody Map<String, Object> request) {
        try {
            String approverRole = request.get("approver").toString();
            String approvalNote = request.get("approvalNote") != null 
                ? request.get("approvalNote").toString() 
                : "";
            boolean approved = Boolean.parseBoolean(request.get("approved").toString());
            
            FinanceRecord result = financeService.approveFinanceRecord(id, approverRole, approvalNote, approved);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

