package com.hongshuo.erp.controller;

import com.hongshuo.erp.model.Role;
import com.hongshuo.erp.model.User;
import com.hongshuo.erp.repository.RoleRepository;
import com.hongshuo.erp.repository.UserRepository;
import com.hongshuo.erp.service.TokenStore;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RoleController.class)
@AutoConfigureMockMvc(addFilters = false)
class RoleControllerTest {

    private static final String ADMIN_TOKEN = "admin-token";
    private static final String PM_TOKEN = "pm-token";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoleRepository roleRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private TokenStore tokenStore;

    private static User adminUser() {
        User u = new User();
        u.setId(1L);
        u.setUsername("admin");
        u.setRole("admin");
        u.setEnabled(true);
        u.setPasswordHash("x");
        return u;
    }

    private static User pmUser() {
        User u = new User();
        u.setId(2L);
        u.setUsername("pm");
        u.setRole("pm");
        u.setEnabled(true);
        u.setPasswordHash("x");
        return u;
    }

    @Test
    void list_requiresAdmin() throws Exception {
        when(tokenStore.getUserByToken(PM_TOKEN)).thenReturn(Optional.of(pmUser()));

        mockMvc.perform(get("/api/roles")
                        .header("Authorization", "Bearer " + PM_TOKEN))
                .andExpect(status().isForbidden());

        verify(roleRepository, never()).findAll();
    }

    @Test
    void list_returnsRoles_withoutUserCountByDefault() throws Exception {
        when(tokenStore.getUserByToken(ADMIN_TOKEN)).thenReturn(Optional.of(adminUser()));
        Role r1 = new Role();
        r1.setId(1L);
        r1.setCode("admin");
        r1.setName("管理员");
        r1.setDescription("内置管理员");
        r1.setBuiltIn(true);

        Role r2 = new Role();
        r2.setId(2L);
        r2.setCode("pm");
        r2.setName("项目经理");
        r2.setBuiltIn(true);

        when(roleRepository.findAll()).thenReturn(List.of(r1, r2));

        mockMvc.perform(get("/api/roles")
                        .header("Authorization", "Bearer " + ADMIN_TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("admin"))
                .andExpect(jsonPath("$[0].userCount").doesNotExist())
                .andExpect(jsonPath("$[1].code").value("pm"));
    }

    @Test
    void list_withUserCount_returnsUserCounts() throws Exception {
        when(tokenStore.getUserByToken(ADMIN_TOKEN)).thenReturn(Optional.of(adminUser()));
        Role r = new Role();
        r.setId(3L);
        r.setCode("custom_pm");
        r.setName("项目经理扩展");
        r.setBuiltIn(false);

        when(roleRepository.findAll()).thenReturn(List.of(r));
        when(userRepository.countByRole("custom_pm")).thenReturn(5L);

        mockMvc.perform(get("/api/roles")
                        .param("withUserCount", "true")
                        .header("Authorization", "Bearer " + ADMIN_TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("custom_pm"))
                .andExpect(jsonPath("$[0].userCount").value(5));
    }

    @Test
    void create_requiresAdmin() throws Exception {
        when(tokenStore.getUserByToken(PM_TOKEN)).thenReturn(Optional.of(pmUser()));

        mockMvc.perform(post("/api/roles")
                        .header("Authorization", "Bearer " + PM_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"analyst\",\"name\":\"分析师\"}"))
                .andExpect(status().isForbidden());

        verify(roleRepository, never()).save(any());
    }

    @Test
    void create_validRole_persistsAndReturns201() throws Exception {
        when(tokenStore.getUserByToken(ADMIN_TOKEN)).thenReturn(Optional.of(adminUser()));
        when(roleRepository.existsByCode("analyst")).thenReturn(false);
        Role saved = new Role();
        saved.setId(10L);
        saved.setCode("analyst");
        saved.setName("分析师");
        saved.setDescription("分析类角色");
        saved.setBuiltIn(false);
        when(roleRepository.save(any(Role.class))).thenReturn(saved);

        mockMvc.perform(post("/api/roles")
                        .header("Authorization", "Bearer " + ADMIN_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"analyst\",\"name\":\"分析师\",\"description\":\"分析类角色\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.code").value("analyst"))
                .andExpect(jsonPath("$.builtIn").value(false))
                .andExpect(jsonPath("$.userCount").value(0));
    }

    @Test
    void create_missingCodeOrName_returns400() throws Exception {
        when(tokenStore.getUserByToken(ADMIN_TOKEN)).thenReturn(Optional.of(adminUser()));

        mockMvc.perform(post("/api/roles")
                        .header("Authorization", "Bearer " + ADMIN_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"\",\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void create_duplicateCode_returns400() throws Exception {
        when(tokenStore.getUserByToken(ADMIN_TOKEN)).thenReturn(Optional.of(adminUser()));
        when(roleRepository.existsByCode("analyst")).thenReturn(true);

        mockMvc.perform(post("/api/roles")
                        .header("Authorization", "Bearer " + ADMIN_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"analyst\",\"name\":\"分析师\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("角色编码已存在"));
    }

    @Test
    void update_notFound_returns404() throws Exception {
        when(tokenStore.getUserByToken(ADMIN_TOKEN)).thenReturn(Optional.of(adminUser()));
        when(roleRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/roles/99")
                        .header("Authorization", "Bearer " + ADMIN_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"新名称\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void update_builtIn_allowsNameButNotCodeChange() throws Exception {
        when(tokenStore.getUserByToken(ADMIN_TOKEN)).thenReturn(Optional.of(adminUser()));
        Role role = new Role();
        role.setId(1L);
        role.setCode("admin");
        role.setName("管理员");
        role.setBuiltIn(true);
        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(userRepository.countByRole("admin")).thenReturn(3L);
        when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(put("/api/roles/1")
                        .header("Authorization", "Bearer " + ADMIN_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"new-admin\",\"name\":\"超级管理员\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("admin"))
                .andExpect(jsonPath("$.name").value("超级管理员"))
                .andExpect(jsonPath("$.userCount").value(3));
    }

    @Test
    void update_nonBuiltIn_duplicateCode_returns400() throws Exception {
        when(tokenStore.getUserByToken(ADMIN_TOKEN)).thenReturn(Optional.of(adminUser()));
        Role role = new Role();
        role.setId(2L);
        role.setCode("custom_pm");
        role.setName("项目经理扩展");
        role.setBuiltIn(false);
        when(roleRepository.findById(2L)).thenReturn(Optional.of(role));
        when(roleRepository.existsByCode("another")).thenReturn(true);

        mockMvc.perform(put("/api/roles/2")
                        .header("Authorization", "Bearer " + ADMIN_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"another\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("角色编码已存在"));
    }

    @Test
    void delete_notFound_returns404() throws Exception {
        when(tokenStore.getUserByToken(ADMIN_TOKEN)).thenReturn(Optional.of(adminUser()));
        when(roleRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/roles/99")
                        .header("Authorization", "Bearer " + ADMIN_TOKEN))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_builtIn_returns400() throws Exception {
        when(tokenStore.getUserByToken(ADMIN_TOKEN)).thenReturn(Optional.of(adminUser()));
        Role role = new Role();
        role.setId(1L);
        role.setCode("admin");
        role.setName("管理员");
        role.setBuiltIn(true);
        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));

        mockMvc.perform(delete("/api/roles/1")
                        .header("Authorization", "Bearer " + ADMIN_TOKEN))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("内置角色不允许删除"));

        verify(roleRepository, never()).deleteById(anyLong());
    }

    @Test
    void delete_whenRoleHasUsers_returns400() throws Exception {
        when(tokenStore.getUserByToken(ADMIN_TOKEN)).thenReturn(Optional.of(adminUser()));
        Role role = new Role();
        role.setId(2L);
        role.setCode("custom_pm");
        role.setName("项目经理扩展");
        role.setBuiltIn(false);
        when(roleRepository.findById(2L)).thenReturn(Optional.of(role));
        when(userRepository.countByRole("custom_pm")).thenReturn(2L);

        mockMvc.perform(delete("/api/roles/2")
                        .header("Authorization", "Bearer " + ADMIN_TOKEN))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("仍有用户使用该角色，无法删除"));

        verify(roleRepository, never()).deleteById(anyLong());
    }
}

