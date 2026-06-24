package com.hongshuo.erp.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hongshuo.erp.model.User;
import com.hongshuo.erp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiSecurityIntegrationTest {

    private static final String TEST_PASSWORD = "123456";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        saveUser("admin", "admin");
        saveUser("pm", "pm");
    }

    @Test
    void unauthenticatedBusinessApiReadAndWriteRequestsAreRejected() throws Exception {
        mockMvc.perform(get("/api/projects"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("未登录"));

        mockMvc.perform(get("/api/config"))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/inventory")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"codex-security-probe","spec":"test","unit":"件","price":1,"quantity":1,"threshold":0}
                    """))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/inventory/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"codex-security-probe","spec":"test","unit":"件","price":1,"quantity":2,"threshold":0}
                    """))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/inventory/1"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void loginIsPublicAndAuthenticatedAdminCanUseBusinessApi() throws Exception {
        String adminToken = login("admin");

        mockMvc.perform(get("/api/projects")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk());

        String body = mockMvc.perform(post("/api/inventory")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"安全回归测试物料","spec":"test","unit":"件","price":1,"quantity":1,"threshold":0}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("安全回归测试物料"))
            .andReturn()
            .getResponse()
            .getContentAsString();

        long itemId = objectMapper.readTree(body).get("id").asLong();
        mockMvc.perform(delete("/api/inventory/" + itemId)
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isNoContent());
    }

    @Test
    void nonAdminCannotReadPermissionsOrDeleteProjects() throws Exception {
        String pmToken = login("pm");

        mockMvc.perform(get("/api/permissions")
                .header("Authorization", "Bearer " + pmToken))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("无权限"));

        mockMvc.perform(delete("/api/projects/1")
                .header("Authorization", "Bearer " + pmToken))
            .andExpect(status().isForbidden());
    }

    @Test
    void disabledUserTokenCannotUseMeOrProtectedApi() throws Exception {
        String pmToken = login("pm");

        User pm = userRepository.findByUsername("pm").orElseThrow();
        pm.setEnabled(false);
        userRepository.save(pm);

        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + pmToken))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/projects")
                .header("Authorization", "Bearer " + pmToken))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void downgradedAdminTokenLosesAdminPermissionImmediately() throws Exception {
        String adminToken = login("admin");

        User admin = userRepository.findByUsername("admin").orElseThrow();
        admin.setRole("pm");
        userRepository.save(admin);

        mockMvc.perform(get("/api/users")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isForbidden());
    }

    @Test
    void createUserRejectsBlankPasswordAndAcceptsValidPassword() throws Exception {
        String adminToken = login("admin");

        mockMvc.perform(post("/api/users")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"username":"blank-user","password":"   ","role":"pm"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").exists());

        mockMvc.perform(post("/api/users")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"username":"valid-user","password":"valid123","role":"pm"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.username").value("valid-user"));
    }

    @Test
    void dataResetEndpointIsDisabledByDefaultEvenForAdmin() throws Exception {
        String adminToken = login("admin");

        mockMvc.perform(post("/api/data/reset")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void apiDebugAndDocumentationPathsAreDenied() throws Exception {
        String adminToken = login("admin");

        mockMvc.perform(get("/api/v3/api-docs")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/swagger-ui/index.html")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/actuator")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isForbidden());
    }

    private String login(String username) throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"username":"%s","password":"%s"}
                    """.formatted(username, TEST_PASSWORD)))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
        JsonNode json = objectMapper.readTree(body);
        return json.get("token").asText();
    }

    private void saveUser(String username, String role) {
        User user = new User();
        user.setUsername(username);
        user.setRole(role);
        user.setEnabled(true);
        user.setPasswordHash(passwordEncoder.encode(TEST_PASSWORD));
        userRepository.save(user);
    }
}
