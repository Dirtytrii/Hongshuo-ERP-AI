package com.hongshuo.erp.integration;

import com.hongshuo.erp.model.FinanceRecord;
import com.hongshuo.erp.model.Project;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import com.hongshuo.erp.repository.ProjectRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 业务链路 HTTP 集成测试：
 * 财务审批（支出/收入） -> 项目成本 / 已收款回写。
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class FinanceProjectHttpIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private FinanceRecordRepository financeRecordRepository;

    @Test
    @Rollback
    void approveExpense_viaHttp_shouldIncreaseProjectMaterialCost() throws Exception {
        Project project = createProject("HTTP-集成测试项目-成本");
        project = projectRepository.save(project);

        FinanceRecord record = new FinanceRecord();
        record.setType(FinanceRecord.FinanceType.expense);
        record.setCategory("材料采购");
        record.setAmount(new BigDecimal("60000.00"));
        record.setProjectId(project.getId());
        record.setCostType("material");
        record.setStatus("pending");
        record.setDate(LocalDate.now());
        record.setCreator("finance");
        record = financeRecordRepository.save(record);

        Project beforeProject = projectRepository.findById(project.getId()).orElseThrow();
        BigDecimal before = beforeProject.getMaterialCost();

        mockMvc.perform(post("/api/finance/{id}/approve", record.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"approver\":\"admin\",\"approved\":true,\"approvalNote\":\"HTTP集成测试-支出\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("approved"));

        Project updated = projectRepository.findById(project.getId()).orElseThrow();
        assertThat(updated.getMaterialCost())
                .isEqualByComparingTo(before.add(new BigDecimal("60000.00")));
    }

    @Test
    @Rollback
    void approveIncome_viaHttp_shouldIncreaseProjectReceivedAmount() throws Exception {
        Project project = createProject("HTTP-集成测试项目-收入");
        project = projectRepository.save(project);

        FinanceRecord record = new FinanceRecord();
        record.setType(FinanceRecord.FinanceType.income);
        record.setCategory("项目收款");
        record.setAmount(new BigDecimal("120000.00"));
        record.setProjectId(project.getId());
        record.setStatus("pending");
        record.setDate(LocalDate.now());
        record.setCreator("finance");
        record = financeRecordRepository.save(record);

        Project beforeProject = projectRepository.findById(project.getId()).orElseThrow();
        BigDecimal before = beforeProject.getReceivedAmount();

        mockMvc.perform(post("/api/finance/{id}/approve", record.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"approver\":\"admin\",\"approved\":true,\"approvalNote\":\"HTTP集成测试-收入\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("approved"));

        Project updated = projectRepository.findById(project.getId()).orElseThrow();
        assertThat(updated.getReceivedAmount())
                .isEqualByComparingTo(before.add(new BigDecimal("120000.00")));
    }

    private Project createProject(String name) {
        Project p = new Project();
        p.setName(name);
        p.setCode("HTTP-" + System.nanoTime());
        p.setManagerId("pm");
        p.setContractAmount(new BigDecimal("1000000.00"));
        p.setReceivedAmount(BigDecimal.ZERO);
        p.setMaterialCost(BigDecimal.ZERO);
        p.setLaborCost(BigDecimal.ZERO);
        p.setOtherCost(BigDecimal.ZERO);
        p.setStatus("施工中");
        p.setProgress(0);
        p.setStartDate(LocalDate.now());
        p.setEndDate(null);
        return p;
    }
}

