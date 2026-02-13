package com.hongshuo.erp.repository;

import com.hongshuo.erp.model.StockLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StockLogRepository extends JpaRepository<StockLog, Long> {
    List<StockLog> findByItemId(Long itemId);
    List<StockLog> findByProjectId(Long projectId);
    List<StockLog> findByStatus(String status);
    List<StockLog> findByDateBetween(LocalDate startDate, LocalDate endDate);
    List<StockLog> findByType(StockLog.StockType type);
}

