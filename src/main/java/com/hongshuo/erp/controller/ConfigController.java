package com.hongshuo.erp.controller;

import com.hongshuo.erp.service.ConfigFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ConfigController {

    private final ConfigFileService configFileService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("lowStockThreshold", configFileService.get("lowStock.threshold", "100"));
        config.put("largeExpenseThreshold", configFileService.get("finance.largeExpense.threshold", "100000"));
        // Phase 4：钉钉/移动端集成开关
        config.put("dingTalkEnabled", configFileService.get("integration.dingtalk.enabled", "false"));
        config.put("dingTalkWebhookUrl", configFileService.get("integration.dingtalk.webhook", ""));
        config.put("mobileApiEnabled", configFileService.get("integration.mobile.enabled", "true"));
        config.put("webBaseUrl", configFileService.get("integration.web.base-url", "http://localhost:3000"));
        config.put("notifySubmittedTemplate", configFileService.get(
            "integration.notify.template.submitted",
            "%s #%s 已提交审批\n发起人：%s\n摘要：%s\n办理入口：%s"
        ));
        config.put("notifyResultTemplate", configFileService.get(
            "integration.notify.template.result",
            "%s #%s 审批%s\n审批人：%s\n查看详情：%s"
        ));
        return ResponseEntity.ok(config);
    }

    @PostMapping
    public ResponseEntity<?> saveConfig(@RequestBody Map<String, Object> config) {
        try {
            if (config.containsKey("lowStockThreshold")) {
                configFileService.set("lowStock.threshold", String.valueOf(config.get("lowStockThreshold")));
            }
            if (config.containsKey("largeExpenseThreshold")) {
                configFileService.set("finance.largeExpense.threshold", String.valueOf(config.get("largeExpenseThreshold")));
            }
            if (config.containsKey("dingTalkEnabled")) {
                configFileService.set("integration.dingtalk.enabled", String.valueOf(config.get("dingTalkEnabled")));
            }
            if (config.containsKey("dingTalkWebhookUrl")) {
                configFileService.set("integration.dingtalk.webhook", String.valueOf(config.get("dingTalkWebhookUrl")));
            }
            if (config.containsKey("mobileApiEnabled")) {
                configFileService.set("integration.mobile.enabled", String.valueOf(config.get("mobileApiEnabled")));
            }
            if (config.containsKey("webBaseUrl")) {
                configFileService.set("integration.web.base-url", String.valueOf(config.get("webBaseUrl")));
            }
            if (config.containsKey("notifySubmittedTemplate")) {
                configFileService.set(
                    "integration.notify.template.submitted",
                    String.valueOf(config.get("notifySubmittedTemplate"))
                );
            }
            if (config.containsKey("notifyResultTemplate")) {
                configFileService.set(
                    "integration.notify.template.result",
                    String.valueOf(config.get("notifyResultTemplate"))
                );
            }
            return ResponseEntity.ok(Map.of("success", true, "message", "配置已保存"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}



