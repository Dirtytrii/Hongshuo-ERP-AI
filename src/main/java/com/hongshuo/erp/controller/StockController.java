package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.StockLog;
import com.hongshuo.erp.service.StockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stock")
public class StockController {

    @Autowired
    private StockService stockService;

    @GetMapping
    public ResponseEntity<List<StockLog>> getAllStockLogs() {
        return ResponseEntity.ok(stockService.getAllStockLogs());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<StockLog>> getPendingStockLogs() {
        return ResponseEntity.ok(stockService.getPendingStockLogs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockLog> getStockLogById(@PathVariable Long id) {
        return stockService.getStockLogById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createStockLog(@RequestBody Map<String, Object> request) {
        try {
            StockLog stockLog = new StockLog();
            stockLog.setType(StockLog.StockType.valueOf(request.get("type").toString()));
            stockLog.setItemId(Long.valueOf(request.get("itemId").toString()));
            stockLog.setQty(Integer.valueOf(request.get("qty").toString()));
            stockLog.setPrice(new java.math.BigDecimal(request.get("price").toString()));
            
            if (request.get("projectId") != null) {
                stockLog.setProjectId(Long.valueOf(request.get("projectId").toString()));
            }
            if (request.get("supplierId") != null && !request.get("supplierId").toString().isBlank()) {
                stockLog.setSupplierId(Long.valueOf(request.get("supplierId").toString()));
            }

            if (request.get("note") != null) {
                stockLog.setNote(request.get("note").toString());
            }
            
            String creatorRole = request.get("creator") != null 
                ? request.get("creator").toString() 
                : "system";
            
            StockLog saved = stockService.createStockLog(stockLog, creatorRole);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveStockOut(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        try {
            String approverRole = request.get("approver").toString();
            String approvalNote = request.get("approvalNote") != null 
                ? request.get("approvalNote").toString() 
                : "";
            boolean approved = Boolean.parseBoolean(request.get("approved").toString());
            
            StockLog result = stockService.approveStockOut(id, approverRole, approvalNote, approved);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 创建库存冲销单（红字冲销）。
     *
     * @param request 包含 originalId（原单ID）、note（冲销说明，可选）、creator（发起人角色）
     * @return 创建的冲销单
     */
    @PostMapping("/reversal")
    public ResponseEntity<?> createReversal(@RequestBody Map<String, Object> request) {
        try {
            Long originalId = Long.valueOf(request.get("originalId").toString());
            String note = request.get("note") != null ? request.get("note").toString() : null;
            String creatorRole = request.get("creator") != null
                ? request.get("creator").toString()
                : "system";
            StockLog reversal = stockService.createReversal(originalId, note, creatorRole);
            return ResponseEntity.status(HttpStatus.CREATED).body(reversal);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 审批库存冲销单。
     *
     * @param id      冲销单 ID
     * @param request 包含 approver、approved、approvalNote
     * @return 更新后的冲销单
     */
    @PostMapping("/{id}/approve-reversal")
    public ResponseEntity<?> approveReversal(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        try {
            String approverRole = request.get("approver").toString();
            String approvalNote = request.get("approvalNote") != null
                ? request.get("approvalNote").toString()
                : "";
            boolean approved = Boolean.parseBoolean(request.get("approved").toString());
            StockLog result = stockService.approveReversal(id, approverRole, approvalNote, approved);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

