package com.hongshuo.erp.repository;

import com.hongshuo.erp.model.FinanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface FinanceRecordRepository extends JpaRepository<FinanceRecord, Long> {
    List<FinanceRecord> findByProjectId(Long projectId);
    List<FinanceRecord> findByStatus(String status);
    List<FinanceRecord> findByDateBetween(LocalDate startDate, LocalDate endDate);
    List<FinanceRecord> findByType(FinanceRecord.FinanceType type);
    List<FinanceRecord> findBySupplierId(Long supplierId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(f.amount), 0) FROM FinanceRecord f WHERE f.projectId = :projectId AND f.type = com.hongshuo.erp.model.FinanceRecord$FinanceType.expense AND f.costType = 'material' AND f.status = 'approved'")
    BigDecimal sumApprovedMaterialByProjectId(@org.springframework.data.repository.query.Param("projectId") Long projectId);

    /** 按供应商汇总：已付 = 该供应商下已审批的支出金额之和 */
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(f.amount), 0) FROM FinanceRecord f WHERE f.supplierId = :supplierId AND f.type = com.hongshuo.erp.model.FinanceRecord$FinanceType.expense AND f.status = 'approved'")
    BigDecimal sumApprovedExpenseBySupplierId(@org.springframework.data.repository.query.Param("supplierId") Long supplierId);

    /** 按回款计划节点汇总：已审批收入金额之和（用于节点已收金额） */
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(f.amount), 0) FROM FinanceRecord f WHERE f.paymentPlanItemId = :paymentPlanItemId AND f.type = com.hongshuo.erp.model.FinanceRecord$FinanceType.income AND f.status = 'approved'")
    BigDecimal sumApprovedIncomeByPaymentPlanItemId(@org.springframework.data.repository.query.Param("paymentPlanItemId") Long paymentPlanItemId);
}

