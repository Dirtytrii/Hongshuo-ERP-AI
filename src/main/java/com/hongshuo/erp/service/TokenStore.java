package com.hongshuo.erp.service;

import com.hongshuo.erp.model.User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory token store for session tokens. For production consider Redis or JWT.
 */
@Service
public class TokenStore {
    private static final Map<String, User> tokens = new ConcurrentHashMap<>();

    public String createToken(User user) {
        String token = UUID.randomUUID().toString();
        tokens.put(token, user);
        return token;
    }

    public Optional<User> getUserByToken(String token) {
        return Optional.ofNullable(tokens.get(token));
    }

    /** Parse Authorization header (Bearer <token>) and return current user if valid. */
    public Optional<User> getCurrentUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return Optional.empty();
        }
        String token = authHeader.substring(7).trim();
        return getUserByToken(token);
    }

    public void removeToken(String token) {
        tokens.remove(token);
    }
}
