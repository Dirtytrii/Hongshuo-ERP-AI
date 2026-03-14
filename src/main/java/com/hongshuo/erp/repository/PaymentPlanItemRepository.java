package com.hongshuo.erp.repository;

import com.hongshuo.erp.model.PaymentPlanItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PaymentPlanItemRepository extends JpaRepository<PaymentPlanItem, Long> {

    List<PaymentPlanItem> findByProjectIdOrderByPlanDateAsc(Long projectId);

    List<PaymentPlanItem> findByPlanDateBeforeOrderByPlanDateAsc(LocalDate date);

    @Query("SELECT p FROM PaymentPlanItem p WHERE p.planDate BETWEEN :start AND :end AND (p.status != 'completed' OR p.receivedAmount < p.planAmount) ORDER BY p.planDate ASC")
    List<PaymentPlanItem> findUpcoming(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
