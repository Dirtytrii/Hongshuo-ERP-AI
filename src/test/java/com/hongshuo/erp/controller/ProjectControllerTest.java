package com.hongshuo.erp.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hongshuo.erp.model.Milestone;
import com.hongshuo.erp.model.Project;
import com.hongshuo.erp.service.ProjectService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProjectController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProjectService projectService;

    @Test
    void getAllProjects_returnsList() throws Exception {
        Project p = createProject(1L, "Test Project", "P001");
        when(projectService.getAllProjects()).thenReturn(List.of(p));

        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Test Project"))
                .andExpect(jsonPath("$[0].code").value("P001"));
    }

    @Test
    void getProjectById_whenExists_returns200() throws Exception {
        Project p = createProject(1L, "Test", "P001");
        when(projectService.getProjectById(1L)).thenReturn(Optional.of(p));

        mockMvc.perform(get("/api/projects/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Test"));
    }

    @Test
    void getProjectById_whenNotExists_returns404() throws Exception {
        when(projectService.getProjectById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/projects/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void createProject_returns201() throws Exception {
        Project input = createProject(null, "New Project", "P002");
        Project saved = createProject(1L, "New Project", "P002");
        when(projectService.createProject(any(Project.class))).thenReturn(saved);

        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(toMap(input))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("New Project"));
    }

    @Test
    void createProject_invalidRequest_returns400() throws Exception {
        when(projectService.createProject(any(Project.class)))
                .thenThrow(new IllegalArgumentException("项目编号已存在"));

        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"x\",\"code\":\"DUP\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateProject_whenExists_returns200() throws Exception {
        Project updated = createProject(1L, "Updated", "P001");
        when(projectService.updateProject(eq(1L), any(Project.class))).thenReturn(updated);

        mockMvc.perform(put("/api/projects/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(toMap(updated))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated"));
    }

    @Test
    void updateProject_whenNotExists_returns404() throws Exception {
        when(projectService.updateProject(eq(999L), any(Project.class)))
                .thenThrow(new RuntimeException("项目不存在"));

        mockMvc.perform(put("/api/projects/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"x\",\"code\":\"P999\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteProject_returns204() throws Exception {
        mockMvc.perform(delete("/api/projects/1"))
                .andExpect(status().isNoContent());
        verify(projectService).deleteProject(1L);
    }

    @Test
    void deleteProject_whenNotExists_returns404() throws Exception {
        org.mockito.Mockito.doThrow(new RuntimeException("项目不存在"))
                .when(projectService).deleteProject(999L);

        mockMvc.perform(delete("/api/projects/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getMilestones_returnsList() throws Exception {
        Milestone m = new Milestone();
        m.setId(1L);
        m.setName("阶段一");
        m.setPlanDate(LocalDate.of(2025, 6, 1));
        m.setStatus(Milestone.MilestoneStatus.pending);
        when(projectService.getMilestonesByProjectId(1L)).thenReturn(List.of(m));

        mockMvc.perform(get("/api/projects/1/milestones"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("阶段一"))
                .andExpect(jsonPath("$[0].status").value("pending"));
    }

    @Test
    void addMilestone_returns200() throws Exception {
        Milestone input = new Milestone();
        input.setName("新里程碑");
        input.setPlanDate(LocalDate.of(2025, 7, 1));
        input.setStatus(Milestone.MilestoneStatus.pending);
        Milestone saved = new Milestone();
        saved.setId(2L);
        saved.setName("新里程碑");
        saved.setPlanDate(LocalDate.of(2025, 7, 1));
        saved.setStatus(Milestone.MilestoneStatus.pending);
        when(projectService.addMilestone(eq(1L), any(Milestone.class))).thenReturn(saved);

        mockMvc.perform(post("/api/projects/1/milestones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"新里程碑\",\"planDate\":\"2025-07-01\",\"status\":\"pending\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.name").value("新里程碑"));
    }

    @Test
    void addMilestone_projectNotExists_returns404() throws Exception {
        when(projectService.addMilestone(eq(999L), any(Milestone.class)))
                .thenThrow(new RuntimeException("项目不存在"));

        mockMvc.perform(post("/api/projects/999/milestones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"M\",\"planDate\":\"2025-07-01\",\"status\":\"pending\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateMilestone_returns200() throws Exception {
        Milestone updated = new Milestone();
        updated.setId(1L);
        updated.setName("已更新");
        updated.setPlanDate(LocalDate.of(2025, 6, 1));
        updated.setStatus(Milestone.MilestoneStatus.completed);
        when(projectService.updateMilestone(eq(1L), eq(1L), any(Milestone.class))).thenReturn(updated);

        mockMvc.perform(put("/api/projects/1/milestones/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"已更新\",\"status\":\"completed\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("completed"));
    }

    @Test
    void deleteMilestone_returns204() throws Exception {
        mockMvc.perform(delete("/api/projects/1/milestones/1"))
                .andExpect(status().isNoContent());
        verify(projectService).deleteMilestone(1L, 1L);
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

    private static java.util.Map<String, Object> toMap(Project p) {
        java.util.Map<String, Object> m = new java.util.HashMap<>();
        m.put("name", p.getName());
        m.put("code", p.getCode());
        m.put("managerId", p.getManagerId());
        m.put("contractAmount", p.getContractAmount().doubleValue());
        m.put("receivedAmount", p.getReceivedAmount().doubleValue());
        m.put("materialCost", p.getMaterialCost().doubleValue());
        m.put("laborCost", p.getLaborCost().doubleValue());
        m.put("otherCost", p.getOtherCost().doubleValue());
        m.put("status", p.getStatus());
        m.put("progress", p.getProgress());
        m.put("startDate", p.getStartDate().toString());
        m.put("endDate", p.getEndDate() != null ? p.getEndDate().toString() : "");
        m.put("milestones", java.util.List.of());
        return m;
    }
}
