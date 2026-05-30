package com.hongshuo.erp.config;

import com.hongshuo.erp.model.User;
import com.hongshuo.erp.service.TokenStore;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Locale;

@Component
@ConditionalOnBean(TokenStore.class)
public class TokenAuthenticationFilter extends OncePerRequestFilter {

    private final TokenStore tokenStore;

    public TokenAuthenticationFilter(TokenStore tokenStore) {
        this.tokenStore = tokenStore;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        tokenStore.getCurrentUser(authHeader)
            .filter(user -> Boolean.TRUE.equals(user.getEnabled()))
            .ifPresent(this::authenticate);

        filterChain.doFilter(request, response);
    }

    private void authenticate(User user) {
        String role = user.getRole() == null ? "" : user.getRole().trim().toUpperCase(Locale.ROOT);
        List<SimpleGrantedAuthority> authorities = role.isEmpty()
            ? List.of()
            : List.of(new SimpleGrantedAuthority("ROLE_" + role));
        UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(user.getUsername(), null, authorities);
        authentication.setDetails(user);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
