package com.hongshuo.erp.controller;

import com.hongshuo.erp.service.ConfigFileService;
import com.hongshuo.erp.service.DingTalkIntegrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/integrations")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(name = "Integrations", description = "外部集成能力（钉钉/移动端）")
public class IntegrationController {
    private final DingTalkIntegrationService dingTalkIntegrationService;
    private final ConfigFileService configFileService;

    @GetMapping("/dingtalk/status")
    @Operation(summary = "钉钉集成状态")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功")
    })
    public ResponseEntity<Map<String, Object>> dingTalkStatus() {
        String webhook = dingTalkIntegrationService.getWebhookUrl();
        return ResponseEntity.ok(Map.of(
            "enabled", dingTalkIntegrationService.isEnabled(),
            "webhookConfigured", !webhook.isBlank()
        ));
    }

    @PostMapping("/dingtalk/test")
    @Operation(summary = "发送钉钉测试消息")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "发送完成")
    })
    public ResponseEntity<Map<String, Object>> dingTalkTest(@RequestBody(required = false) Map<String, Object> body) {
        String message = body != null && body.get("message") != null
            ? String.valueOf(body.get("message"))
            : "集成测试通过";
        boolean ok = dingTalkIntegrationService.sendText("钉钉集成测试", message);
        return ResponseEntity.ok(Map.of("success", ok));
    }

    @GetMapping("/mobile/status")
    @Operation(summary = "移动端集成状态")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功")
    })
    public ResponseEntity<Map<String, Object>> mobileStatus() {
        boolean enabled = Boolean.parseBoolean(configFileService.get("integration.mobile.enabled", "true"));
        return ResponseEntity.ok(Map.of("enabled", enabled));
    }
}
