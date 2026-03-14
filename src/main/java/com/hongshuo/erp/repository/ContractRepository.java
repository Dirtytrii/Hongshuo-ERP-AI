package com.hongshuo.erp.repository;

import com.hongshuo.erp.model.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {
    List<Contract> findByProjectIdOrderBySignedDateDesc(Long projectId);

    List<Contract> findBySettlementStatusOrderBySignedDateDesc(String settlementStatus);

    List<Contract> findByMonitoringStatusOrderBySignedDateDesc(String monitoringStatus);

    @Query("select coalesce(sum(c.contractAmount), 0) from Contract c where c.projectId = :projectId")
    BigDecimal sumContractAmountByProjectId(@Param("projectId") Long projectId);

    @Query("select coalesce(sum(c.contractAmount), 0) from Contract c where c.settlementStatus = :settlementStatus")
    BigDecimal sumContractAmountBySettlementStatus(@Param("settlementStatus") String settlementStatus);

    long countByProjectId(Long projectId);
}
