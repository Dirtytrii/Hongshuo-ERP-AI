package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.ProjectDocument;
import com.hongshuo.erp.service.ProjectDocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/project-documents")
@CrossOrigin(origins = "*")
@Tag(name = "ProjectDocuments", description = "项目文档清单（P2-1 轻量版：名称+链接+备注）")
public class ProjectDocumentController {

    @Autowired
    private ProjectDocumentService projectDocumentService;

    @GetMapping
    @Operation(summary = "按项目获取文档清单", description = "根据项目ID查询该项目的文档清单列表。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(
            mediaType = "application/json",
            array = @ArraySchema(schema = @Schema(implementation = ProjectDocument.class))
        ))
    })
    public ResponseEntity<List<ProjectDocument>> getByProjectId(
            @Parameter(description = "项目ID", required = true)
            @RequestParam Long projectId) {
        return ResponseEntity.ok(projectDocumentService.getByProjectId(projectId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取文档详情")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = ProjectDocument.class))),
        @ApiResponse(responseCode = "404", description = "不存在")
    })
    public ResponseEntity<ProjectDocument> getById(
            @Parameter(description = "文档ID") @PathVariable Long id) {
        ProjectDocument doc = projectDocumentService.getById(id);
        return doc != null ? ResponseEntity.ok(doc) : ResponseEntity.notFound().build();
    }

    @PostMapping
    @Operation(summary = "新增项目文档")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "创建成功",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = ProjectDocument.class))),
        @ApiResponse(responseCode = "400", description = "参数错误")
    })
    public ResponseEntity<?> create(
            @RequestBody ProjectDocument doc,
            @RequestParam Long projectId) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectDocumentService.create(projectId, doc));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新项目文档")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "更新成功",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = ProjectDocument.class))),
        @ApiResponse(responseCode = "400", description = "参数错误"),
        @ApiResponse(responseCode = "404", description = "不存在")
    })
    public ResponseEntity<?> update(
            @Parameter(description = "文档ID") @PathVariable Long id,
            @RequestBody ProjectDocument doc) {
        try {
            return ResponseEntity.ok(projectDocumentService.update(id, doc));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("不存在")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除项目文档")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "不存在")
    })
    public ResponseEntity<?> delete(
            @Parameter(description = "文档ID") @PathVariable Long id) {
        try {
            projectDocumentService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("不存在")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }
}
