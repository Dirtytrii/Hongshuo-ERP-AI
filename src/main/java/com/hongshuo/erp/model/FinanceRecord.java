package com.hongshuo.erp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "finance_records")
public class FinanceRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FinanceType type;
    
    @Column(nullable = false)
    private String category;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;
    
    @Column(name = "project_id")
    private Long projectId;
    
    @Column(nullable = false)
    private String status; // pending, approved, rejected
    
    @Column(nullable = false)
    private LocalDate date;
    
    @Column(nullable = false)
    private String creator;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "approver")
    private String approver; // 审核人
    
    @Column(name = "approval_date")
    private LocalDate approvalDate;
    
    @Column(name = "approval_note", columnDefinition = "TEXT")
    private String approvalNote; // 审核备注
    
    public enum FinanceType {
        income, expense
    }
}

