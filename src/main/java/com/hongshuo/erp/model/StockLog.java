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

    /** 供应商ID，可选；入库可关联供应商。 */
    @Column(name = "supplier_id")
    private Long supplierId;

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
    private String approvalNote;

    /** 红字冲销：关联的原单ID；本记录为冲销单时非空。 */
    @Column(name = "reversal_of_id")
    private Long reversalOfId;

    /** 是否为红字冲销单（冲销单数量为负，用于抵消原单）。 */
    @Column(name = "is_reversal", nullable = false, columnDefinition = "boolean not null default false")
    private Boolean isReversal = false;
    
    public enum StockType {
        in, out
    }
}

