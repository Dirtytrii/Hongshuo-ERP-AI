package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.SystemLog;
import com.hongshuo.erp.service.SystemLogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SystemLogController.class)
@AutoConfigureMockMvc(addFilters = false)
class SystemLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SystemLogService systemLogService;

    @Test
    void getAllLogs_returnsList() throws Exception {
        SystemLog log = new SystemLog();
        log.setId(1L);
        log.setTime(LocalDateTime.now());
        log.setUser("admin");
        log.setAction("登录");
        log.setDetail("用户登录");
        when(systemLogService.getAllLogs()).thenReturn(List.of(log));

        mockMvc.perform(get("/api/logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].action").value("登录"));
    }

    @Test
    void getLogsByUser_returnsList() throws Exception {
        SystemLog log = new SystemLog();
        log.setId(1L);
        log.setTime(LocalDateTime.now());
        log.setUser("pm");
        log.setAction("创建项目");
        log.setDetail("项目P001");
        when(systemLogService.getLogsByUser("pm")).thenReturn(List.of(log));

        mockMvc.perform(get("/api/logs/user/pm"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].user").value("pm"));
    }

    @Test
    void getLogsByAction_returnsList() throws Exception {
        SystemLog log = new SystemLog();
        log.setId(1L);
        log.setTime(LocalDateTime.now());
        log.setUser("admin");
        log.setAction("物料入库");
        log.setDetail("水泥 100吨");
        when(systemLogService.getLogsByAction("物料入库")).thenReturn(List.of(log));

        mockMvc.perform(get("/api/logs/action/物料入库"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].action").value("物料入库"));
    }

    @Test
    void deleteLog_returns204() throws Exception {
        mockMvc.perform(delete("/api/logs/1"))
                .andExpect(status().isNoContent());
        verify(systemLogService).deleteLog(1L);
    }
}
