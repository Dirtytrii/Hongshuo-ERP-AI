package com.hongshuo.erp.repository;

import com.hongshuo.erp.model.ChangeOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ChangeOrderRepository extends JpaRepository<ChangeOrder, Long> {
    List<ChangeOrder> findByProjectIdOrderByCreatedAtDesc(Long projectId);
    List<ChangeOrder> findByStatus(String status);

    @Query("select coalesce(sum(c.amount), 0) from ChangeOrder c where c.projectId = :projectId and c.status = 'approved'")
    BigDecimal sumApprovedAmountByProjectId(@Param("projectId") Long projectId);
}
