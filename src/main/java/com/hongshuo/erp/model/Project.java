package com.hongshuo.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "projects")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(unique = true, nullable = false)
    private String code;
    
    @Column(nullable = false)
    private String managerId;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal contractAmount;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal receivedAmount = BigDecimal.ZERO;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal materialCost = BigDecimal.ZERO;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal laborCost = BigDecimal.ZERO;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal otherCost = BigDecimal.ZERO;

    /** 控制预算（总预算），用于超支预警与校验；null 表示不设预算控制 */
    @Column(name = "total_budget", precision = 15, scale = 2)
    private BigDecimal totalBudget;

    @Column(nullable = false)
    private String status;
    
    @Column(nullable = false)
    private Integer progress = 0;
    
    @Column(nullable = false)
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Milestone> milestones = new ArrayList<>();

    /** 来自财务已审批支出的材料成本汇总（仅展示，不持久化） */
    @Transient
    @JsonProperty("materialCostFromFinance")
    private BigDecimal materialCostFromFinance;

    /** 来自出库的材料金额汇总（仅展示，不持久化） */
    @Transient
    @JsonProperty("materialCostFromStock")
    private BigDecimal materialCostFromStock;

    /** 材料成本合计 = 财务 + 出库（仅展示，不持久化） */
    @Transient
    @JsonProperty("materialCostTotal")
    private BigDecimal materialCostTotal;

    /** 实际成本合计 = 材料合计 + 人工 + 其他（仅展示，不持久化） */
    @Transient
    @JsonProperty("actualCostTotal")
    private BigDecimal actualCostTotal;

    /** 预算使用比例 0~1+（仅展示，不持久化） */
    @Transient
    @JsonProperty("budgetRatio")
    private BigDecimal budgetRatio;

    /** 预算预警状态：green / yellow / red（仅展示，不持久化） */
    @Transient
    @JsonProperty("budgetAlertStatus")
    private String budgetAlertStatus;
}
