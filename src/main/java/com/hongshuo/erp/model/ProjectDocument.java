package com.hongshuo.erp.model;

import jakarta.persistence.*;
import lombok.Data;

/**
 * 项目文档清单（P2-1 轻量版）：仅名称、链接、备注，不涉及文件上传与存储。
 */
@Data
@Entity
@Table(name = "project_documents")
public class ProjectDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(nullable = false, length = 256)
    private String name;

    @Column(length = 1024)
    private String link;

    @Column(columnDefinition = "TEXT")
    private String remark;
}
