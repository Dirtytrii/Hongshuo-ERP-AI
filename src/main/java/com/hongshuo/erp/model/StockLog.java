package com.hongshuo.erp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "stock_logs")
public class StockLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StockType type;
    
    @Column(name = "item_id", nullable = false)
    private Long itemId;
    
    @Column(nullable = false)
    private Integer qty;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;
    
    @Column(name = "project_id")
    private Long projectId;
    
    @Column(nullable = false)
    private String status; // pending, approved, rejected, active
    
    @Column(nullable = false)
    private LocalDate date;
    
    @Column(nullable = false)
    private String creator;
    
    @Column(columnDefinition = "TEXT")
    private String note;
    
    @Column(name = "approver")
    private String approver; // 审核人（出库时需要）
    
    @Column(name = "approval_date")
    private LocalDate approvalDate;
    
    @Column(name = "approval_note", columnDefinition = "TEXT")
    private String approvalNote; // 审核备注
    
    public enum StockType {
        in, out
    }
}

