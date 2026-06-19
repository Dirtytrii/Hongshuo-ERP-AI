package com.hongshuo.erp.repository;

import com.hongshuo.erp.model.StockLog;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockLogRepository extends JpaRepository<StockLog, Long> {
    List<StockLog> findByItemId(Long itemId);
    List<StockLog> findByProjectId(Long projectId);
    List<StockLog> findByStatus(String status);
    List<StockLog> findByDateBetween(LocalDate startDate, LocalDate endDate);
    List<StockLog> findByType(StockLog.StockType type);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM StockLog s WHERE s.id = :id")
    Optional<StockLog> findByIdForUpdate(@Param("id") Long id);

    /** 按项目汇总已生效出库金额：sum(qty*price)，仅 type=out 且 status=active 且 projectId 非空 */
    @Query("SELECT COALESCE(SUM(s.qty * s.price), 0) FROM StockLog s WHERE s.projectId = :projectId AND s.type = com.hongshuo.erp.model.StockLog$StockType.out AND s.status = 'active'")
    BigDecimal sumOutboundAmountByProjectId(@Param("projectId") Long projectId);

    /** 按供应商汇总入库金额：sum(qty*price)，仅 type=in 且 supplierId 非空 */
    @Query("SELECT COALESCE(SUM(s.qty * s.price), 0) FROM StockLog s WHERE s.supplierId = :supplierId AND s.type = com.hongshuo.erp.model.StockLog$StockType.in")
    BigDecimal sumInboundAmountBySupplierId(@Param("supplierId") Long supplierId);
}

