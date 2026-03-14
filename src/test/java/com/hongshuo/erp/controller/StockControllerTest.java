package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.StockLog;
import com.hongshuo.erp.service.StockService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StockController.class)
@AutoConfigureMockMvc(addFilters = false)
class StockControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StockService stockService;

    @Test
    void getAllStockLogs_returnsList() throws Exception {
        StockLog log = createStockLog(1L, StockLog.StockType.in, 10, "active");
        when(stockService.getAllStockLogs()).thenReturn(List.of(log));

        mockMvc.perform(get("/api/stock"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].type").value("in"))
                .andExpect(jsonPath("$[0].qty").value(10));
    }

    @Test
    void getPendingStockLogs_returnsList() throws Exception {
        StockLog log = createStockLog(1L, StockLog.StockType.out, 5, "pending");
        when(stockService.getPendingStockLogs()).thenReturn(List.of(log));

        mockMvc.perform(get("/api/stock/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("pending"));
    }

    @Test
    void getStockLogById_whenExists_returns200() throws Exception {
        StockLog log = createStockLog(1L, StockLog.StockType.in, 10, "active");
        when(stockService.getStockLogById(1L)).thenReturn(Optional.of(log));

        mockMvc.perform(get("/api/stock/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void getStockLogById_whenNotExists_returns404() throws Exception {
        when(stockService.getStockLogById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/stock/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void createStockLog_in_returns201() throws Exception {
        StockLog saved = createStockLog(1L, StockLog.StockType.in, 20, "active");
        when(stockService.createStockLog(any(StockLog.class), anyString())).thenReturn(saved);

        mockMvc.perform(post("/api/stock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"in\",\"itemId\":1,\"qty\":20,\"price\":100,\"creator\":\"clerk\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("in"))
                .andExpect(jsonPath("$.qty").value(20));
    }

    @Test
    void createStockLog_invalidRequest_returns400() throws Exception {
        when(stockService.createStockLog(any(StockLog.class), anyString()))
                .thenThrow(new RuntimeException("物料不存在"));

        mockMvc.perform(post("/api/stock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"in\",\"itemId\":999,\"qty\":1,\"price\":10}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void approveStockOut_approved_returns200() throws Exception {
        StockLog approved = createStockLog(1L, StockLog.StockType.out, 5, "active");
        approved.setApprover("admin");
        when(stockService.approveStockOut(eq(1L), anyString(), anyString(), eq(true))).thenReturn(approved);

        mockMvc.perform(post("/api/stock/1/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"approver\":\"admin\",\"approved\":true,\"approvalNote\":\"OK\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("active"));
    }

    @Test
    void approveStockOut_rejected_returns200() throws Exception {
        StockLog rejected = createStockLog(1L, StockLog.StockType.out, 5, "rejected");
        when(stockService.approveStockOut(eq(1L), anyString(), anyString(), eq(false))).thenReturn(rejected);

        mockMvc.perform(post("/api/stock/1/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"approver\":\"pm\",\"approved\":false,\"approvalNote\":\"no\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("rejected"));
    }

    private static StockLog createStockLog(Long id, StockLog.StockType type, int qty, String status) {
        StockLog log = new StockLog();
        if (id != null) log.setId(id);
        log.setType(type);
        log.setItemId(1L);
        log.setQty(qty);
        log.setPrice(BigDecimal.valueOf(100));
        log.setStatus(status);
        log.setDate(LocalDate.now());
        log.setCreator("system");
        return log;
    }
}
