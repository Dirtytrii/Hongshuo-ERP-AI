package com.hongshuo.erp.repository;

import com.hongshuo.erp.model.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByStatusOrderByDateDesc(String status);

    List<Loan> findByProjectIdOrderByDateDesc(Long projectId);

    List<Loan> findByDepartmentIdOrderByDateDesc(Long departmentId);

    @Query("select coalesce(sum(l.amount),0) from Loan l where l.departmentId = :departmentId and l.status = 'approved'")
    BigDecimal sumApprovedByDepartmentId(@Param("departmentId") Long departmentId);
}
