package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.Project;
import com.hongshuo.erp.model.Milestone;
import com.hongshuo.erp.service.ProjectService;
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

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@Tag(name = "Projects", description = "项目与里程碑管理接口")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @GetMapping
    @Operation(summary = "获取项目列表", description = "返回所有项目的基础信息，用于项目列表和仪表盘。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(
            mediaType = "application/json",
            array = @ArraySchema(schema = @Schema(implementation = Project.class))
        ))
    })
    public ResponseEntity<List<Project>> getAllProjects() {
        List<Project> list = projectService.getAllProjects();
        list.forEach(projectService::enrichWithCostSummary);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取项目详情", description = "根据项目ID获取详细信息，包括金额、进度、成本等字段。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = Project.class))),
        @ApiResponse(responseCode = "404", description = "项目不存在")
    })
    public ResponseEntity<Project> getProjectById(
            @Parameter(description = "项目ID", example = "1001")
            @PathVariable Long id) {
        return projectService.getProjectById(id)
            .map(project -> {
                projectService.enrichWithCostSummary(project);
                return ResponseEntity.ok(project);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 按项目汇总已生效出库金额（材料领用金额）
     */
    @GetMapping("/{id}/outbound-sum")
    @Operation(summary = "获取项目出库汇总金额", description = "根据项目ID汇总已生效出库记录金额，用于项目成本/库存分析。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(
            mediaType = "application/json"
        )),
        @ApiResponse(responseCode = "404", description = "项目不存在")
    })
    public ResponseEntity<Map<String, Object>> getOutboundSum(
            @Parameter(description = "项目ID", example = "1001")
            @PathVariable Long id) {
        if (projectService.getProjectById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        BigDecimal sum = projectService.getOutboundAmountSum(id);
        Map<String, Object> body = new HashMap<>();
        body.put("projectId", id);
        body.put("outboundAmount", sum);
        return ResponseEntity.ok(body);
    }

    @PostMapping
    @Operation(summary = "创建项目", description = "创建一个新项目，自动初始化默认里程碑和进度。")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "创建成功",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = Project.class))),
        @ApiResponse(responseCode = "400", description = "请求参数不合法或业务校验失败")
    })
    public ResponseEntity<Project> createProject(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "项目创建参数：名称、编号(code)、项目经理、合同金额、计划起止日期等。成本与已收款字段通常由财务模块自动回写。",
                required = true
            )
            @RequestBody Project project) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.createProject(project));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新项目", description = "更新项目信息（不包括由财务自动回写的成本与已收款）。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "更新成功",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = Project.class))),
        @ApiResponse(responseCode = "404", description = "项目不存在")
    })
    public ResponseEntity<Project> updateProject(
            @Parameter(description = "项目ID", example = "1001")
            @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "项目更新参数：允许更新名称、项目经理、状态、进度、计划时间等；成本与已收款通常不在此接口修改。",
                required = true
            )
            @RequestBody Project project) {
        try {
            return ResponseEntity.ok(projectService.updateProject(id, project));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除项目", description = "根据项目ID删除项目及其里程碑信息。仅在未实际立项或演示数据场景使用。")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "项目不存在")
    })
    public ResponseEntity<Void> deleteProject(
            @Parameter(description = "项目ID", example = "1001")
            @PathVariable Long id) {
        try {
            projectService.deleteProject(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{projectId}/milestones")
    @Operation(summary = "新增里程碑", description = "在指定项目下新增一个里程碑节点，用于驱动项目进度。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "新增成功",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = Milestone.class))),
        @ApiResponse(responseCode = "404", description = "项目不存在")
    })
    public ResponseEntity<Milestone> addMilestone(
            @Parameter(description = "项目ID", example = "1001")
            @PathVariable Long projectId,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "里程碑信息：名称、计划日期、状态(pending/completed)等。",
                required = true
            )
            @RequestBody Milestone milestone) {
        try {
            return ResponseEntity.ok(projectService.addMilestone(projectId, milestone));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{projectId}/milestones")
    @Operation(summary = "获取项目里程碑列表", description = "根据项目ID查询全部里程碑，用于项目详情页展示进度。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(
            mediaType = "application/json",
            array = @ArraySchema(schema = @Schema(implementation = Milestone.class))
        ))
    })
    public ResponseEntity<List<Milestone>> getMilestones(
            @Parameter(description = "项目ID", example = "1001")
            @PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.getMilestonesByProjectId(projectId));
    }

    @PutMapping("/{projectId}/milestones/{milestoneId}")
    @Operation(summary = "更新里程碑", description = "更新指定项目下某个里程碑的名称、计划日期或完成状态。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "更新成功",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = Milestone.class))),
        @ApiResponse(responseCode = "404", description = "项目或里程碑不存在")
    })
    public ResponseEntity<Milestone> updateMilestone(
            @Parameter(description = "项目ID", example = "1001")
            @PathVariable Long projectId,
            @Parameter(description = "里程碑ID", example = "1")
            @PathVariable Long milestoneId,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "里程碑更新参数：支持更新名称、计划日期、状态等。",
                required = true
            )
            @RequestBody Milestone milestone) {
        try {
            return ResponseEntity.ok(projectService.updateMilestone(projectId, milestoneId, milestone));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{projectId}/milestones/{milestoneId}")
    @Operation(summary = "删除里程碑", description = "删除指定项目下的某个里程碑，通常用于纠错或演示数据清理。")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "项目或里程碑不存在")
    })
    public ResponseEntity<Void> deleteMilestone(
            @Parameter(description = "项目ID", example = "1001")
            @PathVariable Long projectId,
            @Parameter(description = "里程碑ID", example = "1")
            @PathVariable Long milestoneId) {
        try {
            projectService.deleteMilestone(projectId, milestoneId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
