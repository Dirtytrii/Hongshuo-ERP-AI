package com.hongshuo.erp.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkflowNotifyServiceTest {

    @Mock
    private DingTalkIntegrationService dingTalkIntegrationService;

    @InjectMocks
    private WorkflowNotifyService workflowNotifyService;

    @Test
    void notifySubmitted_shouldDelegateToDingTalkService() {
        when(dingTalkIntegrationService.sendText(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString()))
            .thenReturn(true);

        workflowNotifyService.notifySubmitted("报销单", 10L, "alice", "金额: 100");

        verify(dingTalkIntegrationService).sendText(
            org.mockito.ArgumentMatchers.eq("待审批提醒"),
            org.mockito.ArgumentMatchers.contains("报销单 #10 已提交审批")
        );
    }

    @Test
    void notifyApprovalResult_shouldDelegateToDingTalkService() {
        when(dingTalkIntegrationService.sendText(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString()))
            .thenReturn(true);

        workflowNotifyService.notifyApprovalResult("借款单", 22L, true, "finance");

        verify(dingTalkIntegrationService).sendText(
            org.mockito.ArgumentMatchers.eq("审批结果通知"),
            org.mockito.ArgumentMatchers.contains("借款单 #22 审批通过")
        );
    }
}
