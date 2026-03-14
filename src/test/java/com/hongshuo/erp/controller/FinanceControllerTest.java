package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.FinanceRecord;
import com.hongshuo.erp.service.FinanceService;
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

@WebMvcTest(FinanceController.class)
@AutoConfigureMockMvc(addFilters = false)
class FinanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FinanceService financeService;

    @Test
    void getAllFinanceRecords_returnsList() throws Exception {
        FinanceRecord r = createRecord(1L, FinanceRecord.FinanceType.income, "收款", 10000, "approved");
        when(financeService.getAllFinanceRecords()).thenReturn(List.of(r));

        mockMvc.perform(get("/api/finance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].type").value("income"))
                .andExpect(jsonPath("$[0].amount").value(10000));
    }

    @Test
    void getPendingFinanceRecords_returnsList() throws Exception {
        FinanceRecord r = createRecord(1L, FinanceRecord.FinanceType.expense, "大额支出", 150000, "pending");
        when(financeService.getPendingFinanceRecords()).thenReturn(List.of(r));

        mockMvc.perform(get("/api/finance/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("pending"));
    }

    @Test
    void getFinanceRecordById_whenExists_returns200() throws Exception {
        FinanceRecord r = createRecord(1L, FinanceRecord.FinanceType.expense, "材料", 5000, "approved");
        when(financeService.getFinanceRecordById(1L)).thenReturn(Optional.of(r));

        mockMvc.perform(get("/api/finance/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void getFinanceRecordById_whenNotExists_returns404() throws Exception {
        when(financeService.getFinanceRecordById(999L)).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/finance/999")).andExpect(status().isNotFound());
    }

    @Test
    void getFinanceRecordsByProjectId_returnsList() throws Exception {
        FinanceRecord r = createRecord(1L, FinanceRecord.FinanceType.expense, "材料", 5000, "approved");
        r.setProjectId(10L);
        when(financeService.getFinanceRecordsByProjectId(10L)).thenReturn(List.of(r));

        mockMvc.perform(get("/api/finance/project/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].projectId").value(10));
    }

    @Test
    void createFinanceRecord_returns201() throws Exception {
        FinanceRecord saved = createRecord(1L, FinanceRecord.FinanceType.income, "合同款", 50000, "approved");
        when(financeService.createFinanceRecord(any(FinanceRecord.class), anyString())).thenReturn(saved);

        mockMvc.perform(post("/api/finance")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"income\",\"category\":\"合同款\",\"amount\":50000,\"creator\":\"finance\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.type").value("income"));
    }

    @Test
    void createFinanceRecord_invalid_returns400() throws Exception {
        when(financeService.createFinanceRecord(any(FinanceRecord.class), anyString()))
                .thenThrow(new RuntimeException("invalid"));

        mockMvc.perform(post("/api/finance")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"income\",\"category\":\"x\",\"amount\":-1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void approveFinanceRecord_approved_returns200() throws Exception {
        FinanceRecord approved = createRecord(1L, FinanceRecord.FinanceType.expense, "大额", 100000, "approved");
        approved.setApprover("admin");
        when(financeService.approveFinanceRecord(eq(1L), anyString(), anyString(), eq(true))).thenReturn(approved);

        mockMvc.perform(post("/api/finance/1/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"approver\":\"admin\",\"approved\":true,\"approvalNote\":\"OK\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("approved"));
    }

    private static FinanceRecord createRecord(Long id, FinanceRecord.FinanceType type, String category, int amount, String status) {
        FinanceRecord r = new FinanceRecord();
        if (id != null) r.setId(id);
        r.setType(type);
        r.setCategory(category);
        r.setAmount(BigDecimal.valueOf(amount));
        r.setStatus(status);
        r.setDate(LocalDate.now());
        r.setCreator("system");
        return r;
    }
}
