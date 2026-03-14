package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.User;
import com.hongshuo.erp.repository.UserRepository;
import com.hongshuo.erp.service.TokenStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private TokenStore tokenStore;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (!requireAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<Map<String, Object>> list = userRepository.findAll().stream()
            .map(UserController::userResponse)
            .toList();
        return ResponseEntity.ok(list);
    }

    /** 供项目表单「项目经理」下拉使用，任意登录用户可调，仅返回 id、username（已启用用户）。 */
    @GetMapping("/options")
    public ResponseEntity<List<Map<String, Object>>> options(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (!requireAuth(auth)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<Map<String, Object>> list = userRepository.findAll().stream()
            .filter(u -> Boolean.TRUE.equals(u.getEnabled()))
            .map(u -> Map.<String, Object>of("id", u.getId(), "username", u.getUsername()))
            .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth) {
        if (!requireAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return userRepository.findById(id)
            .map(u -> ResponseEntity.ok(userResponse(u)))
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, @RequestHeader(value = "Authorization", required = false) String auth) {
        if (!requireAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        String username = (String) body.get("username");
        String password = body.get("password") != null ? (String) body.get("password") : "";
        String role = (String) body.get("role");
        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "用户名不能为空"));
        }
        if (role == null || role.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "角色不能为空"));
        }
        if (userRepository.existsByUsername(username.trim())) {
            return ResponseEntity.badRequest().body(Map.of("error", "用户名已存在"));
        }
        User user = new User();
        user.setUsername(username.trim());
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role.trim());
        user.setEnabled(true);
        if (body.containsKey("departmentId") && body.get("departmentId") != null && !body.get("departmentId").toString().isBlank()) {
            user.setDepartmentId(Long.valueOf(body.get("departmentId").toString()));
        }
        user = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(userResponse(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body, @RequestHeader(value = "Authorization", required = false) String auth) {
        if (!requireAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Optional<User> opt = userRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = opt.get();
        if (body.containsKey("username")) {
            String username = ((String) body.get("username")).trim();
            if (!username.isEmpty() && !username.equals(user.getUsername()) && userRepository.existsByUsername(username)) {
                return ResponseEntity.badRequest().body(Map.of("error", "用户名已存在"));
            }
            if (!username.isEmpty()) user.setUsername(username);
        }
        if (body.containsKey("password") && body.get("password") != null) {
            String pwd = (String) body.get("password");
            if (!pwd.isEmpty()) user.setPasswordHash(passwordEncoder.encode(pwd));
        }
        if (body.containsKey("role")) user.setRole(((String) body.get("role")).trim());
        if (body.containsKey("enabled")) user.setEnabled(Boolean.TRUE.equals(body.get("enabled")));
        if (body.containsKey("departmentId")) {
            Object dep = body.get("departmentId");
            if (dep == null || dep.toString().isBlank()) user.setDepartmentId(null);
            else user.setDepartmentId(Long.valueOf(dep.toString()));
        }
        user = userRepository.save(user);
        return ResponseEntity.ok(userResponse(user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @RequestHeader(value = "Authorization", required = false) String auth) {
        if (!requireAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        if (userRepository.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private boolean requireAdmin(String auth) {
        String token = auth != null && auth.startsWith("Bearer ") ? auth.substring(7).trim() : null;
        if (token == null) return false;
        return tokenStore.getUserByToken(token)
            .map(u -> "admin".equals(u.getRole()))
            .orElse(false);
    }

    private boolean requireAuth(String auth) {
        String token = auth != null && auth.startsWith("Bearer ") ? auth.substring(7).trim() : null;
        return token != null && tokenStore.getUserByToken(token).isPresent();
    }

    private static Map<String, Object> userResponse(User user) {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        map.put("role", user.getRole());
        map.put("enabled", user.getEnabled());
        map.put("departmentId", user.getDepartmentId());
        return map;
    }
}
