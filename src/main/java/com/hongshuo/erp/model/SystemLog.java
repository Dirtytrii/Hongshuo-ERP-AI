package com.hongshuo.erp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "system_logs")
public class SystemLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private LocalDateTime time;
    
    @Column(name = "operator", nullable = false)
    private String user;  // 字段名保持为 user，但数据库列名为 operator（避免与 H2 保留关键字冲突）
    
    @Column(nullable = false)
    private String action;
    
    @Column(columnDefinition = "TEXT")
    private String detail;
}

