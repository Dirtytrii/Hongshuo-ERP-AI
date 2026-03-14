package com.hongshuo.erp.service;

import com.hongshuo.erp.model.FinanceRecord;
import com.hongshuo.erp.repository.FinanceRecordRepository;
import com.hongshuo.erp.repository.ProjectRepository;
import com.hongshuo.erp.repository.SystemLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FinanceServiceTest {

    @Mock
    private FinanceRecordRepository financeRecordRepository;

    @Mock
    private SystemLogRepository systemLogRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectService projectService;
    @Mock
    private ProjectDocumentAutoCollectService projectDocumentAutoCollectService;
    @Mock
    private WorkflowNotifyService workflowNotifyService;

    @InjectMocks
    private FinanceService financeService;

    @Test
    void getAllFinanceRecords_returnsFromRepository() {
        FinanceRecord r = createRecord(1L, FinanceRecord.FinanceType.income, "收款", 10000, "approved");
        when(financeRecordRepository.findAll()).thenReturn(List.of(r));

        List<FinanceRecord> result = financeService.getAllFinanceRecords();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCategory()).isEqualTo("收款");
    }

    @Test
    void getFinanceRecordById_whenExists_returnsOptional() {
        FinanceRecord r = createRecord(1L, FinanceRecord.FinanceType.expense, "材料", 5000, "approved");
        when(financeRecordRepository.findById(1L)).thenReturn(Optional.of(r));
        assertThat(financeService.getFinanceRecordById(1L)).contains(r);
    }

    @Test
    void getFinanceRecordById_whenNotExists_returnsEmpty() {
        when(financeRecordRepository.findById(999L)).thenReturn(Optional.empty());
        assertThat(financeService.getFinanceRecordById(999L)).isEmpty();
    }

    @Test
    void createFinanceRecord_smallExpense_setsApproved() {
        FinanceRecord input = createRecord(null, FinanceRecord.FinanceType.expense, "材料", 5000, null);
        when(financeRecordRepository.save(any(FinanceRecord.class))).thenAnswer(inv -> inv.getArgument(0));

        FinanceRecord result = financeService.createFinanceRecord(input, "finance");

        assertThat(result.getStatus()).isEqualTo("approved");
        verify(financeRecordRepository).save(input);
    }

    @Test
    void createFinanceRecord_largeExpense_setsPending() {
        FinanceRecord input = createRecord(null, FinanceRecord.FinanceType.expense, "设备", 150000, null);
        when(financeRecordRepository.save(any(FinanceRecord.class))).thenAnswer(inv -> inv.getArgument(0));

        FinanceRecord result = financeService.createFinanceRecord(input, "finance");

        assertThat(result.getStatus()).isEqualTo("pending");
        verify(financeRecordRepository).save(input);
    }

    @Test
    void approveFinanceRecord_whenPending_approves() {
        FinanceRecord record = createRecord(1L, FinanceRecord.FinanceType.expense, "大额", 100000, "pending");
        when(financeRecordRepository.findById(1L)).thenReturn(Optional.of(record));
        when(financeRecordRepository.save(any(FinanceRecord.class))).thenAnswer(inv -> inv.getArgument(0));

        FinanceRecord result = financeService.approveFinanceRecord(1L, "admin", "OK", true);

        assertThat(result.getStatus()).isEqualTo("approved");
        assertThat(record.getApprover()).isEqualTo("admin");
    }

    @Test
    void approveFinanceRecord_nonAdmin_throws() {
        FinanceRecord record = createRecord(1L, FinanceRecord.FinanceType.expense, "大额", 100000, "pending");
        when(financeRecordRepository.findById(1L)).thenReturn(Optional.of(record));

        assertThatThrownBy(() -> financeService.approveFinanceRecord(1L, "clerk", "no", true))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("只有管理员可以审核");
        verify(financeRecordRepository, never()).save(any());
    }

    @Test
    void getFinanceRecordsByProjectId_returnsFromRepository() {
        FinanceRecord r = createRecord(1L, FinanceRecord.FinanceType.expense, "材料", 5000, "approved");
        r.setProjectId(10L);
        when(financeRecordRepository.findByProjectId(10L)).thenReturn(List.of(r));

        List<FinanceRecord> result = financeService.getFinanceRecordsByProjectId(10L);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getProjectId()).isEqualTo(10L);
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
