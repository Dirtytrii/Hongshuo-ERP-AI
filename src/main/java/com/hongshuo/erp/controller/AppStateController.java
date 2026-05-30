package com.hongshuo.erp.controller;

import com.hongshuo.erp.repository.ProjectDocumentRepository;
import com.hongshuo.erp.service.ProjectService;
import com.hongshuo.erp.service.InventoryService;
import com.hongshuo.erp.service.FinanceService;
import com.hongshuo.erp.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 提供完整应用状态快照，用于 AI 分析
 */
@RestController
@RequestMapping("/api/app-state")
@RequiredArgsConstructor
public class AppStateController {

    private final ProjectService projectService;
    private final InventoryService inventoryService;
    private final FinanceService financeService;
    private final StockService stockService;
    private final ProjectDocumentRepository projectDocumentRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAppState() {
        Map<String, Object> state = new HashMap<>();
        state.put("projects", projectService.getAllProjects());
        state.put("inventory", inventoryService.getAllInventory());
        state.put("financeRecords", financeService.getAllFinanceRecords());
        state.put("stockLogs", stockService.getAllStockLogs());
        state.put("projectDocuments", projectDocumentRepository.findAll());
        return ResponseEntity.ok(state);
    }
}

