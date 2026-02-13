package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.FinanceRecord;
import com.hongshuo.erp.service.FinanceService;
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
public class FinanceController {

    @Autowired
    private FinanceService financeService;

    @GetMapping
    public ResponseEntity<List<FinanceRecord>> getAllFinanceRecords() {
        return ResponseEntity.ok(financeService.getAllFinanceRecords());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<FinanceRecord>> getPendingFinanceRecords() {
        return ResponseEntity.ok(financeService.getPendingFinanceRecords());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FinanceRecord> getFinanceRecordById(@PathVariable Long id) {
        return financeService.getFinanceRecordById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<FinanceRecord>> getFinanceRecordsByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(financeService.getFinanceRecordsByProjectId(projectId));
    }

    @PostMapping
    public ResponseEntity<?> createFinanceRecord(@RequestBody Map<String, Object> request) {
        try {
            FinanceRecord record = new FinanceRecord();
            record.setType(FinanceRecord.FinanceType.valueOf(request.get("type").toString()));
            record.setCategory(request.get("category").toString());
            record.setAmount(new BigDecimal(request.get("amount").toString()));
            
            if (request.get("projectId") != null) {
                record.setProjectId(Long.valueOf(request.get("projectId").toString()));
            }
            
            if (request.get("description") != null) {
                record.setDescription(request.get("description").toString());
            }
            
            String creatorRole = request.get("creator") != null 
                ? request.get("creator").toString() 
                : "system";
            
            FinanceRecord saved = financeService.createFinanceRecord(record, creatorRole);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveFinanceRecord(
            @PathVariable Long id,
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

