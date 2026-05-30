package com.hongshuo.erp.controller;

import com.hongshuo.erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/data")
public class DataResetController {

    @Autowired
    private SystemLogRepository systemLogRepository;
    
    @Autowired
    private StockLogRepository stockLogRepository;
    
    @Autowired
    private FinanceRecordRepository financeRecordRepository;
    
    @Autowired
    private MilestoneRepository milestoneRepository;
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> resetData() {
        try {
            // 清空所有数据（按依赖关系顺序）
            systemLogRepository.deleteAll();
            stockLogRepository.deleteAll();
            financeRecordRepository.deleteAll();
            milestoneRepository.deleteAll();
            projectRepository.deleteAll();
            inventoryItemRepository.deleteAll();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "数据已重置，请重启应用以重新初始化数据"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
}



