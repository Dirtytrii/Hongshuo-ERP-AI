package com.hongshuo.erp.integration;

import com.hongshuo.erp.model.FinanceRecord;
import com.hongshuo.erp.model.Project;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import com.hongshuo.erp.repository.ProjectRepository;
import com.hongshuo.erp.service.FinanceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 业务链路集成测试：财务审批 -> 项目成本/已收款回写
 */
@SpringBootTest
@Transactional
class FinanceProjectIntegrationTest {

    @Autowired
    private FinanceService financeService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private FinanceRecordRepository financeRecordRepository;

    @Test
    @Rollback
    void approveExpense_shouldIncreaseProjectMaterialCost() {
        Project project = createProject("集成测试项目-成本");
        project = projectRepository.save(project);

        FinanceRecord record = new FinanceRecord();
        record.setType(FinanceRecord.FinanceType.expense);
        record.setCategory("材料采购");
        record.setAmount(new BigDecimal("50000.00"));
        record.setProjectId(project.getId());
        record.setStatus("pending");
        record.setDate(LocalDate.now());
        record.setCreator("finance");
        record = financeRecordRepository.save(record);

        Project beforeProject = projectRepository.findById(project.getId()).orElseThrow();
        BigDecimal before = beforeProject.getMaterialCost();

        financeService.approveFinanceRecord(record.getId(), "admin", "集成测试审批通过", true);

        Project updated = projectRepository.findById(project.getId()).orElseThrow();
        assertThat(updated.getMaterialCost()).isEqualByComparingTo(before.add(new BigDecimal("50000.00")));
    }

    @Test
    @Rollback
    void approveIncome_shouldIncreaseProjectReceivedAmount() {
        Project project = createProject("集成测试项目-收入");
        project = projectRepository.save(project);

        FinanceRecord record = new FinanceRecord();
        record.setType(FinanceRecord.FinanceType.income);
        record.setCategory("项目收款");
        record.setAmount(new BigDecimal("80000.00"));
        record.setProjectId(project.getId());
        record.setStatus("pending");
        record.setDate(LocalDate.now());
        record.setCreator("finance");
        record = financeRecordRepository.save(record);

        Project beforeProject = projectRepository.findById(project.getId()).orElseThrow();
        BigDecimal before = beforeProject.getReceivedAmount();

        financeService.approveFinanceRecord(record.getId(), "admin", "集成测试收入审批", true);

        Project updated = projectRepository.findById(project.getId()).orElseThrow();
        assertThat(updated.getReceivedAmount()).isEqualByComparingTo(before.add(new BigDecimal("80000.00")));
    }

    private Project createProject(String name) {
        Project p = new Project();
        p.setName(name);
        p.setCode("IT-" + System.nanoTime());
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

