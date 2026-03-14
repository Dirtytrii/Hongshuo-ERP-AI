package com.hongshuo.erp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "contracts")
public class Contract {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "contract_no", nullable = false, length = 64)
    private String contractNo;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(name = "contract_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal contractAmount;

    @Column(name = "signed_date", nullable = false)
    private LocalDate signedDate;

    @Column(name = "settlement_status", nullable = false, length = 32)
    private String settlementStatus; // unsettled / partial / settled

    @Column(name = "monitoring_status", nullable = false, length = 32)
    private String monitoringStatus; // normal / warning / risk

    @Column(columnDefinition = "TEXT")
    private String remark;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
