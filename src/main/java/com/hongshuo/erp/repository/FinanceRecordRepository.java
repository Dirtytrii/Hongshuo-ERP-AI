package com.hongshuo.erp.repository;

import com.hongshuo.erp.model.FinanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FinanceRecordRepository extends JpaRepository<FinanceRecord, Long> {
    List<FinanceRecord> findByProjectId(Long projectId);
    List<FinanceRecord> findByStatus(String status);
    List<FinanceRecord> findByDateBetween(LocalDate startDate, LocalDate endDate);
    List<FinanceRecord> findByType(FinanceRecord.FinanceType type);
}

