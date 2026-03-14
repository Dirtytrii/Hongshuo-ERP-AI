package com.hongshuo.erp.service;

import com.hongshuo.erp.model.FinanceRecord;
import com.hongshuo.erp.model.Project;
import com.hongshuo.erp.model.Reimbursement;
import com.hongshuo.erp.repository.DepartmentRepository;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import com.hongshuo.erp.repository.ProjectRepository;
import com.hongshuo.erp.repository.ReimbursementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReimbursementServiceTest {

    @Mock
    private ReimbursementRepository reimbursementRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private FinanceRecordRepository financeRecordRepository;
    @Mock
    private ProjectDocumentAutoCollectService projectDocumentAutoCollectService;
    @Mock
    private WorkflowNotifyService workflowNotifyService;

    @InjectMocks
    private ReimbursementService reimbursementService;

    private Reimbursement reimbursement;

    @BeforeEach
    void setUp() {
        reimbursement = new Reimbursement();
        reimbursement.setId(1L);
        reimbursement.setProjectId(10L);
        reimbursement.setDepartmentId(20L);
        reimbursement.setApplicant("alice");
        reimbursement.setAmount(new BigDecimal("1200.00"));
        reimbursement.setCategory("差旅");
        reimbursement.setCreator("alice");
        reimbursement.setDate(LocalDate.now());
    }

    @Test
    void create_shouldDefaultDraftStatus() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(new Project()));
        when(departmentRepository.findById(20L)).thenReturn(Optional.of(new com.hongshuo.erp.model.Department()));
        when(reimbursementRepository.save(any(Reimbursement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reimbursement.setStatus(null);
        Reimbursement saved = reimbursementService.create(reimbursement);

        assertThat(saved.getStatus()).isEqualTo("draft");
        assertThat(saved.getDate()).isNotNull();
    }

    @Test
    void submit_shouldThrowWhenNotDraft() {
        reimbursement.setStatus("submitted");
        when(reimbursementRepository.findById(1L)).thenReturn(Optional.of(reimbursement));

        assertThrows(RuntimeException.class, () -> reimbursementService.submit(1L));
    }

    @Test
    void approve_shouldWriteBackProjectCostAndFinanceRecord() {
        reimbursement.setStatus("submitted");
        reimbursement.setApprover("finance");
        Project project = new Project();
        project.setId(10L);
        project.setOtherCost(new BigDecimal("100.00"));

        when(reimbursementRepository.findById(1L)).thenReturn(Optional.of(reimbursement));
        when(reimbursementRepository.save(any(Reimbursement.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        Reimbursement approved = reimbursementService.approve(1L, "finance", true, "ok");

        assertThat(approved.getStatus()).isEqualTo("approved");
        assertThat(project.getOtherCost()).isEqualTo(new BigDecimal("1300.00"));
        verify(projectRepository).save(project);

        ArgumentCaptor<FinanceRecord> captor = ArgumentCaptor.forClass(FinanceRecord.class);
        verify(financeRecordRepository).save(captor.capture());
        assertThat(captor.getValue().getType()).isEqualTo(FinanceRecord.FinanceType.expense);
        assertThat(captor.getValue().getAmount()).isEqualByComparingTo("1200.00");

        verify(projectDocumentAutoCollectService).collect(
            10L,
            "reimbursement",
            "报销单 #1",
            "/reimbursements/1",
            "报销审批通过，金额: 1200.00，报销人: alice"
        );
    }
}
