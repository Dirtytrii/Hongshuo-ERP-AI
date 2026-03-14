package com.hongshuo.erp.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 角色编码，用于与用户表中的 role 以及权限配置中的角色标识对应
     * 如：admin / pm / finance / clerk / custom_xx
     */
    @Column(nullable = false, unique = true, length = 64)
    private String code;

    /**
     * 角色名称，展示给用户看的中文名
     */
    @Column(nullable = false, length = 64)
    private String name;

    /**
     * 角色描述，可选
     */
    @Column(length = 255)
    private String description;

    /**
     * 是否为内置角色（内置角色不允许删除，限制部分编辑）
     */
    @Column(name = "built_in", nullable = false)
    private Boolean builtIn = Boolean.TRUE;
}

