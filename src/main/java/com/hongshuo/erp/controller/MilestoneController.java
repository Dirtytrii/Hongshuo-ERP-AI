package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.dto.OverdueMilestoneDto;
import com.hongshuo.erp.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/milestones")
@Tag(name = "Milestones", description = "里程碑与超期预警")
public class MilestoneController {

    @Autowired
    private ProjectService projectService;

    @GetMapping("/overdue")
    @Operation(summary = "里程碑超期预警", description = "返回当前用户可见项目中「计划日期已过且未完成」的里程碑，供仪表盘展示。")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "查询成功", content = @Content(
            mediaType = "application/json",
            array = @ArraySchema(schema = @Schema(implementation = OverdueMilestoneDto.class))
        ))
    })
    public ResponseEntity<List<OverdueMilestoneDto>> getOverdue() {
        return ResponseEntity.ok(projectService.getOverdueMilestones());
    }
}
