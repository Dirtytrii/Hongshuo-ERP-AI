package com.hongshuo.erp.config;

import com.hongshuo.erp.repository.ProjectRepository;
import com.hongshuo.erp.repository.RoleRepository;
import com.hongshuo.erp.repository.UserRepository;
import com.hongshuo.erp.service.BusinessDataResetService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataInitializerResetTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private BusinessDataResetService businessDataResetService;

    @Test
    void resetOnStartupShouldReuseFullBusinessResetBeforeClearingAuthTables() {
        DataInitializer initializer = new DataInitializer();
        ReflectionTestUtils.setField(initializer, "projectRepository", projectRepository);
        ReflectionTestUtils.setField(initializer, "roleRepository", roleRepository);
        ReflectionTestUtils.setField(initializer, "userRepository", userRepository);
        ReflectionTestUtils.setField(initializer, "passwordEncoder", passwordEncoder);
        ReflectionTestUtils.setField(initializer, "businessDataResetService", businessDataResetService);
        ReflectionTestUtils.setField(initializer, "resetOnStartup", true);
        ReflectionTestUtils.setField(initializer, "seedDemoData", false);
        ReflectionTestUtils.setField(initializer, "bootstrapDefaultPassword", "");
        ReflectionTestUtils.setField(initializer, "allowInsecureDefaultPassword", false);

        when(projectRepository.count()).thenReturn(1L);
        when(roleRepository.count()).thenReturn(1L);
        when(roleRepository.existsByCode(anyString())).thenReturn(true);
        when(userRepository.count()).thenReturn(1L);
        when(userRepository.findAll()).thenReturn(List.of());

        initializer.run();

        InOrder resetOrder = inOrder(businessDataResetService, roleRepository, userRepository);
        resetOrder.verify(businessDataResetService).resetBusinessData();
        resetOrder.verify(roleRepository).deleteAll();
        resetOrder.verify(userRepository).deleteAll();
        verify(userRepository).findAll();
    }
}
