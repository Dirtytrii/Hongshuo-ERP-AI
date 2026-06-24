package com.hongshuo.erp.integration;

import com.hongshuo.erp.model.FinanceRecord;
import com.hongshuo.erp.model.Project;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import com.hongshuo.erp.repository.ProjectRepository;
import com.hongshuo.erp.service.FinanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class FinanceProjectConcurrencyIntegrationTest {

    @Autowired
    private FinanceService financeService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private FinanceRecordRepository financeRecordRepository;

    @BeforeEach
    void cleanData() {
        financeRecordRepository.deleteAll();
        projectRepository.deleteAll();
    }

    @Test
    void concurrentApprovalOfDifferentFinanceRecordsDoesNotLoseProjectCostUpdate() throws Exception {
        Project project = projectRepository.save(createProject());
        FinanceRecord first = financeRecordRepository.save(createPendingExpense(project.getId(), "60000.00"));
        FinanceRecord second = financeRecordRepository.save(createPendingExpense(project.getId(), "70000.00"));

        CyclicBarrier barrier = new CyclicBarrier(2);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            List<Future<FinanceRecord>> results = executor.invokeAll(List.of(
                approveAfterBarrier(first.getId(), barrier),
                approveAfterBarrier(second.getId(), barrier)
            ));

            for (Future<FinanceRecord> result : results) {
                assertThat(result.get().getStatus()).isEqualTo("approved");
            }
        } finally {
            executor.shutdownNow();
        }

        Project updated = projectRepository.findById(project.getId()).orElseThrow();
        assertThat(updated.getMaterialCost()).isEqualByComparingTo(new BigDecimal("130000.00"));
    }

    private Callable<FinanceRecord> approveAfterBarrier(Long recordId, CyclicBarrier barrier) {
        return () -> {
            barrier.await();
            return financeService.approveFinanceRecord(recordId, "admin", "concurrency approval", true);
        };
    }

    private Project createProject() {
        Project project = new Project();
        project.setName("Finance concurrency project");
        project.setCode("FC-" + System.nanoTime());
        project.setManagerId("pm");
        project.setContractAmount(new BigDecimal("1000000.00"));
        project.setReceivedAmount(BigDecimal.ZERO);
        project.setMaterialCost(BigDecimal.ZERO);
        project.setLaborCost(BigDecimal.ZERO);
        project.setOtherCost(BigDecimal.ZERO);
        project.setStatus("active");
        project.setProgress(0);
        project.setStartDate(LocalDate.now());
        return project;
    }

    private FinanceRecord createPendingExpense(Long projectId, String amount) {
        FinanceRecord record = new FinanceRecord();
        record.setType(FinanceRecord.FinanceType.expense);
        record.setCategory("material");
        record.setCostType("material");
        record.setAmount(new BigDecimal(amount));
        record.setProjectId(projectId);
        record.setStatus("pending");
        record.setDate(LocalDate.now());
        record.setCreator("finance");
        return record;
    }
}
