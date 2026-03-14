package com.hongshuo.erp.repository;

import com.hongshuo.erp.model.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, Long> {
    List<Milestone> findByProjectId(Long projectId);

    /** 超期未完成：计划日期早于给定日期、状态非 completed、且项目 ID 在给定集合内；JOIN FETCH 避免 N+1 */
    @Query("SELECT m FROM Milestone m JOIN FETCH m.project p WHERE p.id IN :projectIds AND m.planDate < :before AND m.status <> com.hongshuo.erp.model.Milestone$MilestoneStatus.completed ORDER BY m.planDate ASC")
    List<Milestone> findOverdueByProjectIdInAndPlanDateBeforeAndStatusNot(
        @Param("projectIds") Collection<Long> projectIds,
        @Param("before") LocalDate before
    );
}

