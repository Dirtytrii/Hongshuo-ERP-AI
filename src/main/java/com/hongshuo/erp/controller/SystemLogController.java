package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.SystemLog;
import com.hongshuo.erp.service.SystemLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
@CrossOrigin(origins = "*")
public class SystemLogController {

    @Autowired
    private SystemLogService systemLogService;

    @GetMapping
    public ResponseEntity<List<SystemLog>> getAllLogs() {
        return ResponseEntity.ok(systemLogService.getAllLogs());
    }

    @GetMapping("/user/{user}")
    public ResponseEntity<List<SystemLog>> getLogsByUser(@PathVariable String user) {
        return ResponseEntity.ok(systemLogService.getLogsByUser(user));
    }

    @GetMapping("/action/{action}")
    public ResponseEntity<List<SystemLog>> getLogsByAction(@PathVariable String action) {
        return ResponseEntity.ok(systemLogService.getLogsByAction(action));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLog(@PathVariable Long id) {
        systemLogService.deleteLog(id);
        return ResponseEntity.noContent().build();
    }
}

