package com.hongshuo.erp.repository;

import com.hongshuo.erp.model.LoanRepayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface LoanRepaymentRepository extends JpaRepository<LoanRepayment, Long> {
    List<LoanRepayment> findByLoanIdOrderByDateDesc(Long loanId);

    List<LoanRepayment> findByStatusOrderByDateDesc(String status);

    @Query("select coalesce(sum(lr.amount),0) from LoanRepayment lr where lr.loanId = :loanId and lr.status = 'approved'")
    BigDecimal sumApprovedByLoanId(@Param("loanId") Long loanId);
}
