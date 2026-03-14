package com.hongshuo.erp.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

@RestController
@RequestMapping("/api/permissions")
@CrossOrigin(origins = "*")
public class PermissionController {

    @Value("${app.permissions.file:permissions.properties}")
    private String permissionsFile;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getPermissions() {
        try {
            Properties props = loadPermissions();
            Map<String, Object> permissions = new HashMap<>();
            
            // 将Properties转换为Map
            for (String key : props.stringPropertyNames()) {
                String value = props.getProperty(key);
                permissions.put(key, value.split(","));
            }
            
            return ResponseEntity.ok(permissions);
        } catch (Exception e) {
            return ResponseEntity.ok(new HashMap<>());
        }
    }

    @PostMapping
    public ResponseEntity<?> savePermissions(@RequestBody Map<String, String[]> permissions) {
        try {
            Properties props = new Properties();
            
            // 将Map转换为Properties
            for (Map.Entry<String, String[]> entry : permissions.entrySet()) {
                props.setProperty(entry.getKey(), String.join(",", entry.getValue()));
            }
            
            savePermissions(props);
            return ResponseEntity.ok(Map.of("success", true, "message", "权限配置已保存"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Properties loadPermissions() throws IOException {
        Properties props = new Properties();
        
        // 如果路径是相对路径，使用项目根目录
        Path filePath;
        if (permissionsFile.startsWith("/") || permissionsFile.contains(":")) {
            // 绝对路径
            filePath = Paths.get(permissionsFile);
        } else {
            // 相对路径，使用项目根目录下的data文件夹
            String projectRoot = System.getProperty("user.dir");
            filePath = Paths.get(projectRoot, "data", permissionsFile);
        }
        
        if (Files.exists(filePath)) {
            try (InputStream is = Files.newInputStream(filePath)) {
                props.load(is);
            }
            // 合并默认权限：文件中没有的键用默认值补全（如新增的 users.view）
            Properties defaults = new Properties();
            setDefaultPermissions(defaults);
            for (String key : defaults.stringPropertyNames()) {
                if (!props.containsKey(key)) {
                    props.setProperty(key, defaults.getProperty(key));
                }
            }
        } else {
            // 如果文件不存在，使用默认权限
            setDefaultPermissions(props);
        }
        
        return props;
    }

    private void savePermissions(Properties props) throws IOException {
        // 如果路径是相对路径，使用项目根目录
        Path filePath;
        if (permissionsFile.startsWith("/") || permissionsFile.contains(":")) {
            // 绝对路径
            filePath = Paths.get(permissionsFile);
        } else {
            // 相对路径，使用项目根目录下的data文件夹
            String projectRoot = System.getProperty("user.dir");
            filePath = Paths.get(projectRoot, "data", permissionsFile);
        }
        
        // 确保父目录存在
        if (filePath.getParent() != null) {
            Files.createDirectories(filePath.getParent());
        }
        
        try (OutputStream os = Files.newOutputStream(filePath)) {
            props.store(os, "Permission Configuration");
        }
    }

    private void setDefaultPermissions(Properties props) {
        // 设置默认权限配置
        // 页面级别权限
        props.setProperty("projects.view", "admin,pm");
        props.setProperty("inventory.view", "admin,pm,finance,clerk");
        props.setProperty("inventory-management.view", "admin,pm");
        props.setProperty("contracts.view", "admin,pm,finance");
        props.setProperty("reimbursements.view", "admin,pm,finance,clerk");
        props.setProperty("loans.view", "admin,pm,finance,clerk");
        props.setProperty("departments.view", "admin,finance");
        props.setProperty("approval-center.view", "admin,pm,finance");
        props.setProperty("integration.view", "admin,pm,finance");
        props.setProperty("finance.view", "admin,pm,finance");
        props.setProperty("reports.view", "admin,pm,finance");
        props.setProperty("history.view", "admin");
        props.setProperty("ai.view", "admin,pm,finance,clerk");
        props.setProperty("users.view", "admin");
        // 按钮级别权限
        props.setProperty("inventory.create", "admin,pm,clerk");
        props.setProperty("inventory.outbound.direct", "admin");
        props.setProperty("inventory.outbound.request", "clerk");
        props.setProperty("inventory.approve", "pm,admin");
        props.setProperty("inventory.delete", "admin,pm");
        props.setProperty("inventory.edit", "admin,pm");
        props.setProperty("project.create", "admin,pm");
        props.setProperty("project.edit", "admin,pm");
        props.setProperty("project.delete", "admin");
        props.setProperty("finance.create", "admin,finance");
        props.setProperty("finance.approve.large", "admin");
        props.setProperty("finance.approve.normal", "admin,finance");
        props.setProperty("finance.delete", "admin");
        props.setProperty("log.export", "admin");
        props.setProperty("log.delete", "admin");
    }
}



