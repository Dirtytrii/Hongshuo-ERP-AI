package com.hongshuo.erp.service;

import com.hongshuo.erp.model.Contract;
import com.hongshuo.erp.model.Project;
import com.hongshuo.erp.repository.ChangeOrderRepository;
import com.hongshuo.erp.repository.ContractRepository;
import com.hongshuo.erp.repository.ProjectRepository;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContractServiceTest {
    @Mock
    private ContractRepository contractRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ChangeOrderRepository changeOrderRepository;

    @InjectMocks
    private ContractService contractService;

    @Test
    void findAll_byProject_returnsProjectContracts() {
        Contract c = createContract(1L, 100L);
        when(contractRepository.findByProjectIdOrderBySignedDateDesc(100L)).thenReturn(List.of(c));

        List<Contract> result = contractService.findAll(100L, null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getProjectId()).isEqualTo(100L);
    }

    @Test
    void create_validContract_savesAndRecalculatesProjectAmount() {
        Contract input = createContract(null, 100L);
        Project p = createProject(100L, BigDecimal.valueOf(5000));

        when(projectRepository.findById(100L)).thenReturn(Optional.of(p));
        when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> {
            Contract c = inv.getArgument(0);
            c.setId(1L);
            return c;
        });
        when(contractRepository.countByProjectId(100L)).thenReturn(1L);
        when(contractRepository.sumContractAmountByProjectId(100L)).thenReturn(BigDecimal.valueOf(6000));
        when(changeOrderRepository.sumApprovedAmountByProjectId(100L)).thenReturn(BigDecimal.valueOf(1000));

        Contract saved = contractService.create(input);

        assertThat(saved.getId()).isEqualTo(1L);
        verify(projectRepository).save(any(Project.class));
    }

    @Test
    void create_whenProjectNotExists_throws() {
        Contract input = createContract(null, 999L);
        when(projectRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contractService.create(input))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("项目不存在");
        verify(contractRepository, never()).save(any());
    }

    @Test
    void update_whenProjectChanged_recalculatesBothProjects() {
        Contract existing = createContract(1L, 100L);
        Contract updates = createContract(null, 200L);
        updates.setContractAmount(BigDecimal.valueOf(2000));
        updates.setName("新合同");
        updates.setContractNo("HT-2026-NEW");

        Project p1 = createProject(100L, BigDecimal.valueOf(7000));
        Project p2 = createProject(200L, BigDecimal.valueOf(8000));

        when(contractRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(projectRepository.findById(100L)).thenReturn(Optional.of(p1));
        when(projectRepository.findById(200L)).thenReturn(Optional.of(p2));
        when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));

        when(contractRepository.countByProjectId(200L)).thenReturn(1L);
        when(contractRepository.sumContractAmountByProjectId(200L)).thenReturn(BigDecimal.valueOf(2000));
        when(changeOrderRepository.sumApprovedAmountByProjectId(200L)).thenReturn(BigDecimal.ZERO);

        when(contractRepository.countByProjectId(100L)).thenReturn(1L);
        when(contractRepository.sumContractAmountByProjectId(100L)).thenReturn(BigDecimal.valueOf(5000));
        when(changeOrderRepository.sumApprovedAmountByProjectId(100L)).thenReturn(BigDecimal.valueOf(500));

        Contract result = contractService.update(1L, updates);

        assertThat(result.getProjectId()).isEqualTo(200L);
        verify(projectRepository).save(p2);
        verify(projectRepository).save(p1);
    }

    @Test
    void recalculateProjectContractAmount_withoutContracts_keepsOriginalAmount() {
        when(contractRepository.countByProjectId(100L)).thenReturn(0L);

        contractService.recalculateProjectContractAmount(100L);

        verify(projectRepository, never()).save(any(Project.class));
    }

    private static Contract createContract(Long id, Long projectId) {
        Contract c = new Contract();
        c.setId(id);
        c.setProjectId(projectId);
        c.setContractNo("HT-2026-001");
        c.setName("一期总包合同");
        c.setContractAmount(BigDecimal.valueOf(1000));
        c.setSignedDate(LocalDate.of(2026, 3, 1));
        c.setSettlementStatus("unsettled");
        c.setMonitoringStatus("normal");
        c.setRemark("测试合同");
        return c;
    }

    private static Project createProject(Long id, BigDecimal contractAmount) {
        Project p = new Project();
        p.setId(id);
        p.setName("项目");
        p.setCode("P-001");
        p.setManagerId("pm");
        p.setContractAmount(contractAmount);
        p.setReceivedAmount(BigDecimal.ZERO);
        p.setMaterialCost(BigDecimal.ZERO);
        p.setLaborCost(BigDecimal.ZERO);
        p.setOtherCost(BigDecimal.ZERO);
        p.setStatus("施工中");
        p.setProgress(0);
        p.setStartDate(LocalDate.of(2026, 1, 1));
        return p;
    }
}
