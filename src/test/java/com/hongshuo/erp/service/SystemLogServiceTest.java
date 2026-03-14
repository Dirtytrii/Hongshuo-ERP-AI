package com.hongshuo.erp.service;

import com.hongshuo.erp.model.SystemLog;
import com.hongshuo.erp.repository.SystemLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SystemLogServiceTest {

    @Mock
    private SystemLogRepository systemLogRepository;

    @InjectMocks
    private SystemLogService systemLogService;

    @Test
    void getAllLogs_returnsFromRepository() {
        SystemLog log = new SystemLog();
        log.setId(1L);
        log.setTime(LocalDateTime.now());
        log.setUser("admin");
        log.setAction("登录");
        log.setDetail("ok");
        when(systemLogRepository.findAll()).thenReturn(List.of(log));

        List<SystemLog> result = systemLogService.getAllLogs();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getAction()).isEqualTo("登录");
    }

    @Test
    void getLogsByUser_returnsFromRepository() {
        SystemLog log = new SystemLog();
        log.setId(1L);
        log.setTime(LocalDateTime.now());
        log.setUser("pm");
        log.setAction("创建项目");
        log.setDetail("P001");
        when(systemLogRepository.findByUser("pm")).thenReturn(List.of(log));

        List<SystemLog> result = systemLogService.getLogsByUser("pm");
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUser()).isEqualTo("pm");
    }

    @Test
    void getLogsByAction_returnsFromRepository() {
        SystemLog log = new SystemLog();
        log.setId(1L);
        log.setTime(LocalDateTime.now());
        log.setUser("admin");
        log.setAction("物料入库");
        log.setDetail("水泥");
        when(systemLogRepository.findByAction("物料入库")).thenReturn(List.of(log));

        List<SystemLog> result = systemLogService.getLogsByAction("物料入库");
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getAction()).isEqualTo("物料入库");
    }

    @Test
    void deleteLog_callsRepository() {
        systemLogService.deleteLog(1L);
        verify(systemLogRepository).deleteById(1L);
    }
}
