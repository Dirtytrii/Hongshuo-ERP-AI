package com.hongshuo.erp.controller;

import com.hongshuo.erp.service.BusinessDataResetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/data")
public class DataResetController {

    @Autowired
    private BusinessDataResetService businessDataResetService;

    @Value("${app.data.reset-endpoint.enabled:false}")
    private boolean resetEndpointEnabled;

    @PostMapping("/reset")
    @Transactional
    public ResponseEntity<Map<String, Object>> resetData() {
        if (!resetEndpointEnabled) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "success", false,
                "error", "Data reset endpoint is disabled"
            ));
        }
        try {
            // 清空所有数据（按依赖关系顺序）
            businessDataResetService.resetBusinessData();
            
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



