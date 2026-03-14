package com.hongshuo.erp.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "suppliers")
public class Supplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(name = "contact_person", length = 64)
    private String contactPerson;

    @Column(name = "contact_phone", length = 32)
    private String contactPhone;

    @Column(name = "bank_info", columnDefinition = "TEXT")
    private String bankInfo;
}
