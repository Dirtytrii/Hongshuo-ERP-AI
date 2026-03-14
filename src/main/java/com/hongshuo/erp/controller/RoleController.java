package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.Role;
import com.hongshuo.erp.repository.RoleRepository;
import com.hongshuo.erp.repository.UserRepository;
import com.hongshuo.erp.service.TokenStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "*")
public class RoleController {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TokenStore tokenStore;

    @Value("${app.permissions.file:permissions.properties}")
    private String permissionsFile;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestParam(value = "withUserCount", required = false, defaultValue = "false") boolean withUserCount) {
        if (!requireAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<Role> roles = roleRepository.findAll();
        List<Map<String, Object>> body = new ArrayList<>();
        for (Role r : roles) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("code", r.getCode());
            map.put("name", r.getName());
            map.put("description", r.getDescription());
            map.put("builtIn", Boolean.TRUE.equals(r.getBuiltIn()));
            if (withUserCount) {
                long cnt = userRepository.countByRole(r.getCode());
                map.put("userCount", cnt);
            }
            body.add(map);
        }
        return ResponseEntity.ok(body);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body,
                                    @RequestHeader(value = "Authorization", required = false) String auth) {
        if (!requireAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        String code = Optional.ofNullable(body.get("code")).map(Object::toString).orElse("").trim();
        String name = Optional.ofNullable(body.get("name")).map(Object::toString).orElse("").trim();
        String description = Optional.ofNullable(body.get("description")).map(Object::toString).orElse("").trim();
        if (code.isEmpty() || name.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "角色编码和名称不能为空"));
        }
        if (roleRepository.existsByCode(code)) {
            return ResponseEntity.badRequest().body(Map.of("error", "角色编码已存在"));
        }
        Role role = new Role();
        role.setCode(code);
        role.setName(name);
        role.setDescription(description);
        // 自定义角色默认非内置
        role.setBuiltIn(false);
        role = roleRepository.save(role);
        return ResponseEntity.status(HttpStatus.CREATED).body(roleToResponse(role, 0L));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @RequestBody Map<String, Object> body,
                                    @RequestHeader(value = "Authorization", required = false) String auth) {
        if (!requireAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Optional<Role> opt = roleRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Role role = opt.get();
        boolean builtIn = Boolean.TRUE.equals(role.getBuiltIn());

        if (body.containsKey("code") && !builtIn) {
            String code = Optional.ofNullable(body.get("code")).map(Object::toString).orElse("").trim();
            if (code.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "角色编码不能为空"));
            }
            if (!code.equals(role.getCode()) && roleRepository.existsByCode(code)) {
                return ResponseEntity.badRequest().body(Map.of("error", "角色编码已存在"));
            }
            role.setCode(code);
        }
        if (body.containsKey("name")) {
            String name = Optional.ofNullable(body.get("name")).map(Object::toString).orElse("").trim();
            if (!name.isEmpty()) {
                role.setName(name);
            }
        }
        if (body.containsKey("description")) {
            String description = Optional.ofNullable(body.get("description")).map(Object::toString).orElse("").trim();
            role.setDescription(description);
        }
        role = roleRepository.save(role);
        long userCount = userRepository.countByRole(role.getCode());
        return ResponseEntity.ok(roleToResponse(role, userCount));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id,
                                    @RequestHeader(value = "Authorization", required = false) String auth) {
        if (!requireAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Optional<Role> opt = roleRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Role role = opt.get();
        if (Boolean.TRUE.equals(role.getBuiltIn())) {
            return ResponseEntity.badRequest().body(Map.of("error", "内置角色不允许删除"));
        }
        long userCount = userRepository.countByRole(role.getCode());
        if (userCount > 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "仍有用户使用该角色，无法删除"));
        }

        // 清理权限配置中对该角色的引用
        try {
            cleanupRoleFromPermissions(role.getCode());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "清理权限配置失败: " + e.getMessage()));
        }

        roleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private boolean requireAdmin(String auth) {
        String token = auth != null && auth.startsWith("Bearer ") ? auth.substring(7).trim() : null;
        if (token == null || token.isEmpty()) return false;
        return tokenStore.getUserByToken(token)
                .map(u -> "admin".equals(u.getRole()))
                .orElse(false);
    }

    private Map<String, Object> roleToResponse(Role r, long userCount) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", r.getId());
        map.put("code", r.getCode());
        map.put("name", r.getName());
        map.put("description", r.getDescription());
        map.put("builtIn", Boolean.TRUE.equals(r.getBuiltIn()));
        map.put("userCount", userCount);
        return map;
    }

    private void cleanupRoleFromPermissions(String roleCode) throws IOException {
        Properties props = loadPermissions();
        boolean changed = false;
        for (String key : props.stringPropertyNames()) {
            String value = props.getProperty(key);
            if (value == null || value.isBlank()) continue;
            String[] parts = value.split(",");
            List<String> kept = new ArrayList<>();
            for (String part : parts) {
                String trimmed = part.trim();
                if (!trimmed.equals(roleCode)) {
                    kept.add(trimmed);
                }
            }
            String newVal = String.join(",", kept);
            if (!newVal.equals(value)) {
                props.setProperty(key, newVal);
                changed = true;
            }
        }
        if (changed) {
            savePermissions(props);
        }
    }

    private Properties loadPermissions() throws IOException {
        Properties props = new Properties();
        Path filePath = resolvePermissionsPath();
        if (Files.exists(filePath)) {
            try (InputStream is = Files.newInputStream(filePath)) {
                props.load(is);
            }
        }
        return props;
    }

    private void savePermissions(Properties props) throws IOException {
        Path filePath = resolvePermissionsPath();
        if (filePath.getParent() != null) {
            Files.createDirectories(filePath.getParent());
        }
        try (OutputStream os = Files.newOutputStream(filePath)) {
            props.store(os, "Permission Configuration (updated by RoleController)");
        }
    }

    private Path resolvePermissionsPath() {
        if (permissionsFile.startsWith("/") || permissionsFile.contains(":")) {
            return Paths.get(permissionsFile);
        } else {
            String projectRoot = System.getProperty("user.dir");
            return Paths.get(projectRoot, "data", permissionsFile);
        }
    }
}

