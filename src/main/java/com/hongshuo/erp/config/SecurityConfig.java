package com.hongshuo.erp.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String SECURITY_HEADERS_CSP = String.join("; ",
        "default-src 'self'",
        "script-src 'self' https://aistudiocdn.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "connect-src 'self' https://api.deepseek.com https://openrouter.ai https://*.openrouter.ai",
        "font-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'none'"
    );

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            CorsConfigurationSource corsConfigurationSource,
            ObjectProvider<TokenAuthenticationFilter> tokenAuthenticationFilter)
            throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp.policyDirectives(SECURITY_HEADERS_CSP))
                .addHeaderWriter(new StaticHeadersWriter(
                    "Permissions-Policy",
                    "camera=(), microphone=(), geolocation=(), payment=(), usb=()"))
                .referrerPolicy(referrer -> referrer.policy(
                    ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .preload(true)
                    .maxAgeInSeconds(31_536_000))
                .frameOptions(frame -> frame.deny()))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(jsonAuthenticationEntryPoint())
                .accessDeniedHandler(jsonAccessDeniedHandler()));

        tokenAuthenticationFilter.ifAvailable(filter ->
            http.addFilterBefore(filter, UsernamePasswordAuthenticationFilter.class));

        http.authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers("/api/swagger-ui.html", "/api/swagger-ui/**").denyAll()
                .requestMatchers("/api/v3/api-docs", "/api/v3/api-docs/**").denyAll()
                .requestMatchers("/api/actuator", "/api/actuator/**").denyAll()
                .requestMatchers("/swagger-ui.html", "/swagger-ui/**").denyAll()
                .requestMatchers("/v3/api-docs", "/v3/api-docs/**").denyAll()
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/actuator", "/actuator/**").denyAll()
                .requestMatchers("/h2-console", "/h2-console/**").denyAll()
                .requestMatchers(HttpMethod.GET, "/api/permissions").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/permissions").hasRole("ADMIN")
                .requestMatchers("/api/config/**", "/api/data/**", "/api/users/**", "/api/roles/**")
                    .hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/logs/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/logs/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/projects/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/projects/**").hasAnyRole("ADMIN", "PM")
                .requestMatchers(HttpMethod.PUT, "/api/projects/**").hasAnyRole("ADMIN", "PM")
                .requestMatchers(HttpMethod.DELETE, "/api/contracts/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/contracts/**").hasAnyRole("ADMIN", "PM")
                .requestMatchers(HttpMethod.PUT, "/api/contracts/**").hasAnyRole("ADMIN", "PM")
                .requestMatchers(HttpMethod.DELETE, "/api/inventory/**").hasAnyRole("ADMIN", "PM")
                .requestMatchers(HttpMethod.PUT, "/api/inventory/**").hasAnyRole("ADMIN", "PM")
                .requestMatchers(HttpMethod.POST, "/api/inventory/**").hasAnyRole("ADMIN", "PM", "CLERK")
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll());
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.security.cors.allowed-origins:"
                + "https://hongshuo-erp-ai.pages.dev,http://localhost:3000,http://localhost:5173,http://localhost:5174}")
            String allowedOrigins) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(splitCsv(allowedOrigins));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Content-Type", "Authorization", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Content-Type"));
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(1_728_000L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    private static List<String> splitCsv(String value) {
        return Arrays.stream(value.split(","))
            .map(String::trim)
            .filter(origin -> !origin.isEmpty())
            .toList();
    }

    private static AuthenticationEntryPoint jsonAuthenticationEntryPoint() {
        return (request, response, authException) ->
            writeJsonError(response, HttpServletResponse.SC_UNAUTHORIZED, "未登录");
    }

    private static AccessDeniedHandler jsonAccessDeniedHandler() {
        return (request, response, accessDeniedException) ->
            writeJsonError(response, HttpServletResponse.SC_FORBIDDEN, "无权限");
    }

    private static void writeJsonError(HttpServletResponse response, int status, String message)
            throws IOException {
        response.setStatus(status);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }
}
