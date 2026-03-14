package com.hongshuo.erp.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 审批流通知门面（当前实现：钉钉机器人）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowNotifyService {
    private final DingTalkIntegrationService dingTalkIntegrationService;

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
            dingTalkIntegrationService.sendText(
                "待审批提醒",
                String.format("%s #%s 已提交审批\n发起人：%s\n摘要：%s", bizType, bizId, applicant, summary)
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
            dingTalkIntegrationService.sendText(
                "审批结果通知",
                String.format("%s #%s 审批%s\n审批人：%s", bizType, bizId, approved ? "通过" : "拒绝", approver)
            );
        } catch (Exception e) {
            log.warn("发送审批结果通知失败: {}", e.getMessage());
        }
    }
}
