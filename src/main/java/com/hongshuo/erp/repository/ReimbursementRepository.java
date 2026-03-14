package com.hongshuo.erp.repository;

import com.hongshuo.erp.model.Reimbursement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ReimbursementRepository extends JpaRepository<Reimbursement, Long> {
    List<Reimbursement> findByStatusOrderByDateDesc(String status);

    List<Reimbursement> findByProjectIdOrderByDateDesc(Long projectId);

    List<Reimbursement> findByDepartmentIdOrderByDateDesc(Long departmentId);

    @Query("select coalesce(sum(r.amount),0) from Reimbursement r where r.departmentId = :departmentId and r.status = 'approved'")
    BigDecimal sumApprovedByDepartmentId(@Param("departmentId") Long departmentId);
}
