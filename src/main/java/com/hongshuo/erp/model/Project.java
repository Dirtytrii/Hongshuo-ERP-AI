package com.hongshuo.erp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "projects")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String code;
    private String managerId;
    
    private BigDecimal contractAmount;
    private BigDecimal receivedAmount;
    private BigDecimal materialCost;
    private BigDecimal laborCost;
    private BigDecimal otherCost;
    
    private String status;
    private Integer progress;
    
    private LocalDate startDate;
    private LocalDate endDate;
}
