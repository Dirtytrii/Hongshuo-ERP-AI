package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.User;
import com.hongshuo.erp.service.TokenStore;
import com.hongshuo.erp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private TokenStore tokenStore;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "用户名和密码不能为空"));
        }
        User user = userRepository.findByUsername(username.trim())
            .orElse(null);
        if (user == null || !user.getEnabled()) {
            return ResponseEntity.status(401).body(Map.of("error", "用户名或密码错误"));
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("error", "用户名或密码错误"));
        }
        String token = tokenStore.createToken(user);
        Map<String, Object> resp = new HashMap<>();
        resp.put("token", token);
        resp.put("user", userResponse(user));
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String auth) {
        String token = parseBearerToken(auth);
        if (token == null) {
            return ResponseEntity.status(401).body(Map.of("error", "未登录"));
        }
        return tokenStore.getUserByToken(token)
            .map(user -> ResponseEntity.ok(userResponse(user)))
            .orElse(ResponseEntity.status(401).body(Map.of("error", "登录已过期")));
    }

    private static String parseBearerToken(String auth) {
        if (auth == null || !auth.startsWith("Bearer ")) return null;
        return auth.substring(7).trim();
    }

    private static Map<String, Object> userResponse(User user) {
        return Map.of(
            "id", user.getId(),
            "username", user.getUsername(),
            "role", user.getRole(),
            "enabled", user.getEnabled()
        );
    }
}
