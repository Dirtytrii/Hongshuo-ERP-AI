package com.hongshuo.erp.model;

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
    
    @Column(nullable = false)
    private String status;
    
    @Column(nullable = false)
    private Integer progress = 0;
    
    @Column(nullable = false)
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Milestone> milestones = new ArrayList<>();
}
