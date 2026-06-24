package com.hongshuo.erp.integration;

import com.hongshuo.erp.model.Project;
import com.hongshuo.erp.model.Reimbursement;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import com.hongshuo.erp.repository.ProjectDocumentRepository;
import com.hongshuo.erp.repository.ProjectRepository;
import com.hongshuo.erp.repository.ReimbursementRepository;
import com.hongshuo.erp.service.ReimbursementService;
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
class ReimbursementProjectConcurrencyIntegrationTest {

    @Autowired
    private ReimbursementService reimbursementService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ReimbursementRepository reimbursementRepository;

    @Autowired
    private FinanceRecordRepository financeRecordRepository;

    @Autowired
    private ProjectDocumentRepository projectDocumentRepository;

    @BeforeEach
    void cleanData() {
        projectDocumentRepository.deleteAll();
        financeRecordRepository.deleteAll();
        reimbursementRepository.deleteAll();
        projectRepository.deleteAll();
    }

    @Test
    void concurrentApprovalOfDifferentReimbursementsDoesNotLoseProjectOtherCostUpdate() throws Exception {
        Project project = projectRepository.save(createProject());
        Reimbursement first = reimbursementRepository.save(createSubmittedReimbursement(project.getId(), "60000.00"));
        Reimbursement second = reimbursementRepository.save(createSubmittedReimbursement(project.getId(), "70000.00"));

        CyclicBarrier barrier = new CyclicBarrier(2);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            List<Future<Reimbursement>> results = executor.invokeAll(List.of(
                approveAfterBarrier(first.getId(), barrier),
                approveAfterBarrier(second.getId(), barrier)
            ));

            for (Future<Reimbursement> result : results) {
                assertThat(result.get().getStatus()).isEqualTo("approved");
            }
        } finally {
            executor.shutdownNow();
        }

        Project updated = projectRepository.findById(project.getId()).orElseThrow();
        assertThat(updated.getOtherCost()).isEqualByComparingTo(new BigDecimal("130000.00"));
    }

    private Callable<Reimbursement> approveAfterBarrier(Long reimbursementId, CyclicBarrier barrier) {
        return () -> {
            barrier.await();
            return reimbursementService.approve(reimbursementId, "finance", true, "concurrency approval");
        };
    }

    private Project createProject() {
        Project project = new Project();
        project.setName("Reimbursement concurrency project");
        project.setCode("RC-" + System.nanoTime());
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

    private Reimbursement createSubmittedReimbursement(Long projectId, String amount) {
        Reimbursement reimbursement = new Reimbursement();
        reimbursement.setProjectId(projectId);
        reimbursement.setApplicant("staff");
        reimbursement.setAmount(new BigDecimal(amount));
        reimbursement.setCategory("travel");
        reimbursement.setStatus("submitted");
        reimbursement.setDate(LocalDate.now());
        reimbursement.setCreator("staff");
        reimbursement.setDescription("concurrency reimbursement");
        return reimbursement;
    }
}
