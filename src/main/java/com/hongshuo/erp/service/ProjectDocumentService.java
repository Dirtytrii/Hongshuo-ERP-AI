package com.hongshuo.erp.service;

import com.hongshuo.erp.model.ProjectDocument;
import com.hongshuo.erp.repository.ProjectDocumentRepository;
import com.hongshuo.erp.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProjectDocumentService {

    @Autowired
    private ProjectDocumentRepository projectDocumentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    public List<ProjectDocument> getByProjectId(Long projectId) {
        return projectDocumentRepository.findByProjectIdOrderByIdAsc(projectId);
    }

    public ProjectDocument getById(Long id) {
        return projectDocumentRepository.findById(id).orElse(null);
    }

    @Transactional
    public ProjectDocument create(Long projectId, ProjectDocument doc) {
        if (projectRepository.findById(projectId).isEmpty()) {
            throw new RuntimeException("项目不存在: " + projectId);
        }
        if (doc.getName() == null || doc.getName().isBlank()) {
            throw new RuntimeException("文档名称不能为空");
        }
        doc.setProjectId(projectId);
        doc.setId(null);
        return projectDocumentRepository.save(doc);
    }

    @Transactional
    public ProjectDocument update(Long id, ProjectDocument updates) {
        ProjectDocument existing = projectDocumentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("项目文档不存在: " + id));
        if (updates.getName() != null) existing.setName(updates.getName());
        if (updates.getLink() != null) existing.setLink(updates.getLink());
        if (updates.getRemark() != null) existing.setRemark(updates.getRemark());
        return projectDocumentRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        if (!projectDocumentRepository.existsById(id)) {
            throw new RuntimeException("项目文档不存在: " + id);
        }
        projectDocumentRepository.deleteById(id);
    }
}
