package com.hongshuo.erp.service;

import com.hongshuo.erp.model.ProjectDocument;
import com.hongshuo.erp.repository.ProjectDocumentRepository;
import com.hongshuo.erp.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 项目资料库自动归集服务。
 */
@Service
@RequiredArgsConstructor
public class ProjectDocumentAutoCollectService {
    private final ProjectDocumentRepository projectDocumentRepository;
    private final ProjectRepository projectRepository;

    /**
     * 自动写入项目资料库。
     *
     * @param projectId 项目ID
     * @param source 来源
     * @param name 标题
     * @param link 业务链接
     * @param remark 备注
     */
    @Transactional
    public void collect(Long projectId, String source, String name, String link, String remark) {
        if (projectId == null || projectRepository.findById(projectId).isEmpty()) {
            return;
        }
        ProjectDocument doc = new ProjectDocument();
        doc.setProjectId(projectId);
        doc.setSource(source != null && !source.isBlank() ? source : "manual");
        doc.setName(name != null && !name.isBlank() ? name : "自动归集记录");
        doc.setLink(link);
        doc.setRemark(remark);
        projectDocumentRepository.save(doc);
    }
}
