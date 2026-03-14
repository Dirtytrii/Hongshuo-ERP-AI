package com.hongshuo.erp.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 128)
    private String passwordHash;

    @Column(nullable = false, length = 32)
    private String role; // admin, pm, finance, clerk

    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(name = "department_id")
    private Long departmentId;
}
