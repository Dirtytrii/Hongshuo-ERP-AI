package com.hongshuo.erp.repository;

import com.hongshuo.erp.model.ChangeOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChangeOrderRepository extends JpaRepository<ChangeOrder, Long> {
    List<ChangeOrder> findByProjectIdOrderByCreatedAtDesc(Long projectId);
    List<ChangeOrder> findByStatus(String status);
}
