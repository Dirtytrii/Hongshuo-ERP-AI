package com.hongshuo.erp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * 钉钉机器人通知服务（Webhook）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DingTalkIntegrationService {

    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5))
        .build();
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final ConfigFileService configFileService;

    /**
     * 是否启用钉钉推送。
     *
     * @return 启用状态
     */
    public boolean isEnabled() {
        return Boolean.parseBoolean(configFileService.get("integration.dingtalk.enabled", "false"));
    }

    /**
     * 获取钉钉 webhook URL。
     *
     * @return webhook URL
     */
    public String getWebhookUrl() {
        return configFileService.get("integration.dingtalk.webhook", "").trim();
    }

    /**
     * 发送文本消息。
     *
     * @param title 标题
     * @param content 内容
     * @return 是否发送成功
     */
    public boolean sendText(String title, String content) {
        if (!isEnabled()) {
            log.info("钉钉推送未启用，跳过发送。title={}", title);
            return false;
        }
        String webhookUrl = getWebhookUrl();
        if (webhookUrl.isBlank()) {
            log.warn("钉钉推送已启用但 webhook 为空，跳过发送。title={}", title);
            return false;
        }
        try {
            String text = "【宏硕ERP】" + title + "\n" + content;
            String body = OBJECT_MAPPER.writeValueAsString(Map.of(
                "msgtype", "text",
                "text", Map.of("content", text)
            ));
            HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(webhookUrl))
                .timeout(Duration.ofSeconds(8))
                .header("Content-Type", "application/json; charset=utf-8")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
            HttpResponse<String> resp = HTTP_CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() / 100 != 2) {
                log.warn("钉钉推送失败，httpStatus={}, body={}", resp.statusCode(), resp.body());
                return false;
            }
            return resp.body() == null || resp.body().contains("\"errcode\":0");
        } catch (Exception e) {
            log.warn("钉钉推送异常: {}", e.getMessage());
            return false;
        }
    }
}
