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

    /** 回款计划节点ID；收入可关联到某节点，节点已收金额可据此自动汇总。 */
    @Column(name = "payment_plan_item_id")
    private Long paymentPlanItemId;

    /** 供应商ID，可选；入库/支出可关联供应商。 */
    @Column(name = "supplier_id")
    private Long supplierId;

    /** 成本类型：material=材料, labor=人工, other=其他。支出审批通过时按此回写项目成本。 */
    @Column(name = "cost_type", length = 20)
    private String costType;
    
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

    /** 红字冲销：关联的原单ID；本记录为冲销单时非空。 */
    @Column(name = "reversal_of_id")
    private Long reversalOfId;

    /** 是否为红字冲销单（冲销单金额为负，用于抵消原单）。 */
    @Column(name = "is_reversal", nullable = false, columnDefinition = "boolean not null default false")
    private Boolean isReversal = false;
    
    public enum FinanceType {
        income, expense
    }
}

