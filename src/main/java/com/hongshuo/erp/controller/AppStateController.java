package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.Project;
import com.hongshuo.erp.model.InventoryItem;
import com.hongshuo.erp.model.FinanceRecord;
import com.hongshuo.erp.model.StockLog;
import com.hongshuo.erp.service.ProjectService;
import com.hongshuo.erp.service.InventoryService;
import com.hongshuo.erp.service.FinanceService;
import com.hongshuo.erp.service.StockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 提供完整应用状态快照，用于 AI 分析
 */
@RestController
@RequestMapping("/api/app-state")
@CrossOrigin(origins = "*")
public class AppStateController {

    @Autowired
    private ProjectService projectService;
    
    @Autowired
    private InventoryService inventoryService;
    
    @Autowired
    private FinanceService financeService;
    
    @Autowired
    private StockService stockService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAppState() {
        Map<String, Object> state = new HashMap<>();
        state.put("projects", projectService.getAllProjects());
        state.put("inventory", inventoryService.getAllInventory());
        state.put("financeRecords", financeService.getAllFinanceRecords());
        state.put("stockLogs", stockService.getAllStockLogs());
        return ResponseEntity.ok(state);
    }
}

