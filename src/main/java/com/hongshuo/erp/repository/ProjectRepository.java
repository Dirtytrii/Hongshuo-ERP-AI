package com.hongshuo.erp.repository;

import com.hongshuo.erp.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Project findByCode(String code);
    boolean existsByCode(String code);
    List<Project> findByManagerId(String managerId);
}

