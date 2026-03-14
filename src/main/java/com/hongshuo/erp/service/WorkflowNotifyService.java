package com.hongshuo.erp.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.IllegalFormatException;

/**
 * 审批流通知门面（当前实现：钉钉机器人）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowNotifyService {
    private final DingTalkIntegrationService dingTalkIntegrationService;
    private final ConfigFileService configFileService;

    /**
     * 单据提交后通知审批待办。
     *
     * @param bizType 单据类型
     * @param bizId 单据ID
     * @param applicant 发起人
     * @param summary 摘要
     */
    public void notifySubmitted(String bizType, Long bizId, String applicant, String summary) {
        try {
            String link = buildBizLink(bizType, bizId);
            String template = valueOrDefault(configFileService.get(
                "integration.notify.template.submitted",
                "%s #%s 已提交审批\n发起人：%s\n摘要：%s\n办理入口：%s"
            ), "%s #%s 已提交审批\n发起人：%s\n摘要：%s\n办理入口：%s");
            String content = safeFormat(
                template,
                bizType,
                String.valueOf(bizId),
                applicant,
                summary,
                link
            );
            dingTalkIntegrationService.sendText(
                "待审批提醒",
                content
            );
        } catch (Exception e) {
            log.warn("发送提交通知失败: {}", e.getMessage());
        }
    }

    /**
     * 单据审批完成后通知结果。
     *
     * @param bizType 单据类型
     * @param bizId 单据ID
     * @param approved 是否通过
     * @param approver 审批人
     */
    public void notifyApprovalResult(String bizType, Long bizId, boolean approved, String approver) {
        try {
            String link = buildBizLink(bizType, bizId);
            String template = valueOrDefault(configFileService.get(
                "integration.notify.template.result",
                "%s #%s 审批%s\n审批人：%s\n查看详情：%s"
            ), "%s #%s 审批%s\n审批人：%s\n查看详情：%s");
            String content = safeFormat(
                template,
                bizType,
                String.valueOf(bizId),
                approved ? "通过" : "拒绝",
                approver,
                link
            );
            dingTalkIntegrationService.sendText(
                "审批结果通知",
                content
            );
        } catch (Exception e) {
            log.warn("发送审批结果通知失败: {}", e.getMessage());
        }
    }

    private String buildBizLink(String bizType, Long bizId) {
        String baseUrl = valueOrDefault(
            configFileService.get("integration.web.base-url", "http://localhost:3000"),
            "http://localhost:3000"
        ).trim();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        String tab = mapBizTypeToTab(bizType);
        return String.format("%s/?tab=%s&id=%s", baseUrl, tab, bizId);
    }

    private static String mapBizTypeToTab(String bizType) {
        if (bizType == null) {
            return "approval-center";
        }
        return switch (bizType) {
            case "财务单", "finance" -> "finance";
            case "变更单", "change_order" -> "change-orders";
            case "报销单", "reimbursement" -> "reimbursements";
            case "借款单", "loan" -> "loans";
            case "还款单", "loan_repayment" -> "loans";
            default -> "approval-center";
        };
    }

    private static String safeFormat(String template, String a, String b, String c, String d, String e) {
        try {
            return String.format(template, a, b, c, d, e);
        } catch (IllegalFormatException ex) {
            return String.format("%s #%s\n%s\n%s\n%s", a, b, c, d, e);
        }
    }

    private static String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
