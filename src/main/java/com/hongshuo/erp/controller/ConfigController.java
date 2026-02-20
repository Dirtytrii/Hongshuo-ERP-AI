package com.hongshuo.erp.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

@RestController
@RequestMapping("/api/config")
@CrossOrigin(origins = "*")
public class ConfigController {

    @Value("${app.config.file:config.properties}")
    private String configFile;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getConfig() {
        try {
            Properties props = loadConfig();
            Map<String, Object> config = new HashMap<>();
            
            // 读取配置值
            config.put("lowStockThreshold", props.getProperty("lowStock.threshold", "100"));
            config.put("largeExpenseThreshold", props.getProperty("finance.largeExpense.threshold", "100000"));
            
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            // 返回默认值
            Map<String, Object> defaultConfig = new HashMap<>();
            defaultConfig.put("lowStockThreshold", "100");
            defaultConfig.put("largeExpenseThreshold", "100000");
            return ResponseEntity.ok(defaultConfig);
        }
    }

    @PostMapping
    public ResponseEntity<?> saveConfig(@RequestBody Map<String, Object> config) {
        try {
            Properties props = new Properties();
            
            // 设置配置值
            if (config.containsKey("lowStockThreshold")) {
                props.setProperty("lowStock.threshold", config.get("lowStockThreshold").toString());
            }
            if (config.containsKey("largeExpenseThreshold")) {
                props.setProperty("finance.largeExpense.threshold", config.get("largeExpenseThreshold").toString());
            }
            
            saveConfig(props);
            return ResponseEntity.ok(Map.of("success", true, "message", "配置已保存"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Properties loadConfig() throws IOException {
        Properties props = new Properties();
        
        // 如果路径是相对路径，使用项目根目录
        Path filePath;
        if (configFile.startsWith("/") || configFile.contains(":")) {
            // 绝对路径
            filePath = Paths.get(configFile);
        } else {
            // 相对路径，使用项目根目录下的data文件夹
            String projectRoot = System.getProperty("user.dir");
            filePath = Paths.get(projectRoot, "data", configFile);
        }
        
        if (Files.exists(filePath)) {
            try (InputStream is = Files.newInputStream(filePath)) {
                props.load(is);
            }
        } else {
            // 如果文件不存在，设置默认值
            props.setProperty("lowStock.threshold", "100");
            props.setProperty("finance.largeExpense.threshold", "100000");
        }
        
        return props;
    }

    private void saveConfig(Properties props) throws IOException {
        // 如果路径是相对路径，使用项目根目录
        Path filePath;
        if (configFile.startsWith("/") || configFile.contains(":")) {
            // 绝对路径
            filePath = Paths.get(configFile);
        } else {
            // 相对路径，使用项目根目录下的data文件夹
            String projectRoot = System.getProperty("user.dir");
            filePath = Paths.get(projectRoot, "data", configFile);
        }
        
        // 确保父目录存在
        if (filePath.getParent() != null) {
            Files.createDirectories(filePath.getParent());
        }
        
        try (OutputStream os = Files.newOutputStream(filePath)) {
            props.store(os, "System Configuration");
        }
    }
}



