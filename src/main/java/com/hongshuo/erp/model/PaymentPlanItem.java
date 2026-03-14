package com.hongshuo.erp.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "payment_plan_items")
public class PaymentPlanItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(name = "plan_date", nullable = false)
    private LocalDate planDate;

    @Column(name = "plan_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal planAmount;

    @Column(name = "received_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal receivedAmount = BigDecimal.ZERO;

    @Column(nullable = false, length = 32)
    private String status; // pending, partial, completed
}
