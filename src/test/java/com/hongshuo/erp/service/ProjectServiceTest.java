package com.hongshuo.erp.service;

import com.hongshuo.erp.model.Milestone;
import com.hongshuo.erp.model.Project;
import com.hongshuo.erp.repository.MilestoneRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private MilestoneRepository milestoneRepository;

    @InjectMocks
    private ProjectService projectService;

    @Test
    void getAllProjects_returnsFromRepository() {
        Project p = createProject(1L, "P1", "CODE1");
        when(projectRepository.findAll()).thenReturn(List.of(p));

        List<Project> result = projectService.getAllProjects();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("P1");
        verify(projectRepository).findAll();
    }

    @Test
    void getProjectById_whenExists_returnsOptional() {
        Project p = createProject(1L, "P1", "CODE1");
        when(projectRepository.findById(1L)).thenReturn(Optional.of(p));

        assertThat(projectService.getProjectById(1L)).contains(p);
    }

    @Test
    void getProjectById_whenNotExists_returnsEmpty() {
        when(projectRepository.findById(999L)).thenReturn(Optional.empty());
        assertThat(projectService.getProjectById(999L)).isEmpty();
    }

    @Test
    void createProject_whenCodeUnique_savesAndReturns() {
        Project input = createProject(null, "New", "NEW001");
        when(projectRepository.existsByCode("NEW001")).thenReturn(false);
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> {
            Project p = inv.getArgument(0);
            if (p.getId() == null) p.setId(1L);
            return p;
        });
        when(milestoneRepository.save(any(Milestone.class))).thenAnswer(inv -> inv.getArgument(0));

        Project result = projectService.createProject(input);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getCode()).isEqualTo("NEW001");
        verify(projectRepository, atLeast(1)).save(any(Project.class));
        verify(milestoneRepository).save(any(Milestone.class));
    }

    @Test
    void createProject_whenCodeExists_throws() {
        Project input = createProject(null, "New", "DUP");
        when(projectRepository.existsByCode("DUP")).thenReturn(true);

        assertThatThrownBy(() -> projectService.createProject(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("项目编号已存在");
        verify(projectRepository, never()).save(any());
    }

    @Test
    void updateProject_whenExists_updatesAndReturns() {
        Project existing = createProject(1L, "Old", "CODE1");
        Project details = createProject(null, "Updated", "CODE1");
        details.setProgress(50);
        when(projectRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(milestoneRepository.findByProjectId(1L)).thenReturn(List.of());
        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        Project result = projectService.updateProject(1L, details);

        assertThat(result.getName()).isEqualTo("Updated");
        verify(projectRepository).save(existing);
    }

    @Test
    void updateProject_whenNotExists_throws() {
        Project details = createProject(null, "X", "CODE1");
        when(projectRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.updateProject(999L, details))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("项目不存在");
        verify(projectRepository, never()).save(any());
    }

    @Test
    void deleteProject_callsRepository() {
        projectService.deleteProject(1L);
        verify(projectRepository).deleteById(1L);
    }

    @Test
    void addMilestone_whenProjectExists_savesAndReturns() {
        Project project = createProject(1L, "P", "P1");
        Milestone milestone = new Milestone();
        milestone.setName("M1");
        milestone.setPlanDate(LocalDate.of(2025, 6, 1));
        milestone.setStatus(Milestone.MilestoneStatus.pending);
        Milestone saved = new Milestone();
        saved.setId(10L);
        saved.setName("M1");
        saved.setPlanDate(LocalDate.of(2025, 6, 1));
        saved.setStatus(Milestone.MilestoneStatus.pending);
        saved.setProject(project);

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(milestoneRepository.save(any(Milestone.class))).thenReturn(saved);
        when(milestoneRepository.findByProjectId(1L)).thenReturn(List.of(saved));

        Milestone result = projectService.addMilestone(1L, milestone);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getName()).isEqualTo("M1");
        verify(milestoneRepository).save(any(Milestone.class));
    }

    @Test
    void addMilestone_whenProjectNotExists_throws() {
        Milestone milestone = new Milestone();
        milestone.setName("M1");
        milestone.setPlanDate(LocalDate.now());
        milestone.setStatus(Milestone.MilestoneStatus.pending);
        when(projectRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.addMilestone(999L, milestone))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("项目不存在");
        verify(milestoneRepository, never()).save(any());
    }

    @Test
    void getMilestonesByProjectId_returnsFromRepository() {
        Milestone m = new Milestone();
        m.setId(1L);
        m.setName("M1");
        m.setPlanDate(LocalDate.of(2025, 6, 1));
        m.setStatus(Milestone.MilestoneStatus.completed);
        when(milestoneRepository.findByProjectId(1L)).thenReturn(List.of(m));

        List<Milestone> result = projectService.getMilestonesByProjectId(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("M1");
    }

    @Test
    void updateMilestone_whenExists_updatesAndReturns() {
        Project project = createProject(1L, "P", "P1");
        Milestone existing = new Milestone();
        existing.setId(1L);
        existing.setName("Old");
        existing.setPlanDate(LocalDate.of(2025, 5, 1));
        existing.setStatus(Milestone.MilestoneStatus.pending);
        existing.setProject(project);
        Milestone details = new Milestone();
        details.setName("Updated");
        details.setStatus(Milestone.MilestoneStatus.completed);

        when(milestoneRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(milestoneRepository.save(any(Milestone.class))).thenAnswer(inv -> inv.getArgument(0));
        when(milestoneRepository.findByProjectId(1L)).thenReturn(List.of(existing));

        Milestone result = projectService.updateMilestone(1L, 1L, details);

        assertThat(result.getName()).isEqualTo("Updated");
        assertThat(result.getStatus()).isEqualTo(Milestone.MilestoneStatus.completed);
        verify(milestoneRepository).save(existing);
    }

    @Test
    void deleteMilestone_whenExists_deletesAndUpdatesProgress() {
        Project project = createProject(1L, "P", "P1");
        Milestone m = new Milestone();
        m.setId(1L);
        m.setName("M1");
        m.setProject(project);
        when(milestoneRepository.findById(1L)).thenReturn(Optional.of(m));
        when(milestoneRepository.findByProjectId(1L)).thenReturn(List.of());

        projectService.deleteMilestone(1L, 1L);

        verify(milestoneRepository).delete(m);
        verify(projectRepository).save(project);
    }

    private static Project createProject(Long id, String name, String code) {
        Project p = new Project();
        if (id != null) p.setId(id);
        p.setName(name);
        p.setCode(code);
        p.setManagerId("M1");
        p.setContractAmount(BigDecimal.valueOf(100000));
        p.setReceivedAmount(BigDecimal.ZERO);
        p.setMaterialCost(BigDecimal.ZERO);
        p.setLaborCost(BigDecimal.ZERO);
        p.setOtherCost(BigDecimal.ZERO);
        p.setStatus("施工中");
        p.setProgress(0);
        p.setStartDate(LocalDate.of(2025, 1, 1));
        p.setEndDate(null);
        return p;
    }
}
