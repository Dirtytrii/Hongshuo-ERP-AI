package com.hongshuo.erp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "inventory")
public class InventoryItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String spec;
    private String unit;
    
    private BigDecimal price;
    private Integer quantity;
    private Integer threshold;
}
