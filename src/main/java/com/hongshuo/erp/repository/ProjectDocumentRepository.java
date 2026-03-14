package com.hongshuo.erp.repository;

import com.hongshuo.erp.model.ProjectDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectDocumentRepository extends JpaRepository<ProjectDocument, Long> {

    List<ProjectDocument> findByProjectIdOrderByIdAsc(Long projectId);

    List<ProjectDocument> findByProjectIdAndSourceOrderByIdAsc(Long projectId, String source);

    void deleteByProjectId(Long projectId);
}
