package com.hongshuo.erp.service;

import com.hongshuo.erp.model.Project;
import com.hongshuo.erp.model.Milestone;
import com.hongshuo.erp.repository.ProjectRepository;
import com.hongshuo.erp.repository.MilestoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProjectService {
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private MilestoneRepository milestoneRepository;
    
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }
    
    public Optional<Project> getProjectById(Long id) {
        return projectRepository.findById(id);
    }
    
    @Transactional
    public Project createProject(Project project) {
        if (projectRepository.existsByCode(project.getCode())) {
            throw new IllegalArgumentException("项目编号已存在: " + project.getCode());
        }
        return projectRepository.save(project);
    }
    
    @Transactional
    public Project updateProject(Long id, Project projectDetails) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("项目不存在: " + id));
        
        project.setName(projectDetails.getName());
        project.setManagerId(projectDetails.getManagerId());
        project.setContractAmount(projectDetails.getContractAmount());
        project.setReceivedAmount(projectDetails.getReceivedAmount());
        project.setMaterialCost(projectDetails.getMaterialCost());
        project.setLaborCost(projectDetails.getLaborCost());
        project.setOtherCost(projectDetails.getOtherCost());
        project.setStatus(projectDetails.getStatus());
        project.setProgress(projectDetails.getProgress());
        project.setStartDate(projectDetails.getStartDate());
        project.setEndDate(projectDetails.getEndDate());
        
        return projectRepository.save(project);
    }
    
    @Transactional
    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }
    
    @Transactional
    public Milestone addMilestone(Long projectId, Milestone milestone) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("项目不存在: " + projectId));
        milestone.setProject(project);
        return milestoneRepository.save(milestone);
    }
    
    public List<Milestone> getMilestonesByProjectId(Long projectId) {
        return milestoneRepository.findByProjectId(projectId);
    }
}

