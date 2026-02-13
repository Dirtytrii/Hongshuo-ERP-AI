package com.hongshuo.erp.repository;

import com.hongshuo.erp.model.SystemLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {
    List<SystemLog> findByUser(String user);
    List<SystemLog> findByTimeBetween(LocalDateTime startTime, LocalDateTime endTime);
    List<SystemLog> findByAction(String action);
}

