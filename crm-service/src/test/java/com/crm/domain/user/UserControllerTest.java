package com.crm.domain.user;

import com.crm.config.SecurityConfig;
import com.crm.domain.user.dto.CreateUserRequest;
import com.crm.domain.user.dto.UpdateProfileRequest;
import com.crm.domain.user.dto.UpdateUserRequest;
import com.crm.domain.user.dto.UserDto;
import com.crm.security.JwtAuthenticationFilter;
import com.crm.security.JwtProperties;
import com.crm.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@Import({SecurityConfig.class, JwtTokenProvider.class, JwtProperties.class, JwtAuthenticationFilter.class})
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    private User testUser;
    private UserDto testUserDto;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("user@example.com");
        testUser.setPassword("$2a$12$encoded");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setRole(Role.USER);
        testUser.setActive(true);
        testUser.setCreatedAt(Instant.now());

        testUserDto = UserDto.from(testUser);
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void getMe_authenticated_returns200WithUserDto() throws Exception {
        when(userService.findByEmail("user@example.com")).thenReturn(testUser);

        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user@example.com"))
                .andExpect(jsonPath("$.firstName").value("Test"));
    }

    @Test
    void getMe_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void updateProfile_validRequest_returns200() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest("Updated", "Name", null);

        User updated = new User();
        updated.setId(1L);
        updated.setEmail("user@example.com");
        updated.setPassword("$2a$12$encoded");
        updated.setFirstName("Updated");
        updated.setLastName("Name");
        updated.setRole(Role.USER);
        updated.setActive(true);
        updated.setCreatedAt(Instant.now());

        when(userService.findByEmail("user@example.com")).thenReturn(testUser);
        when(userService.updateProfile(eq(1L), any(UpdateProfileRequest.class))).thenReturn(updated);

        mockMvc.perform(put("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Updated"));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = "ADMIN")
    void getAllUsers_adminRole_returns200WithList() throws Exception {
        when(userService.findAll()).thenReturn(List.of(testUser));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("user@example.com"));
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void getAllUsers_userRole_returns403() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = "ADMIN")
    void createUser_adminRole_validRequest_returns201() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
                "new@example.com", "Password1!", "New", "User", Role.USER);

        User newUser = new User();
        newUser.setId(5L);
        newUser.setEmail("new@example.com");
        newUser.setPassword("$2a$12$encoded");
        newUser.setFirstName("New");
        newUser.setLastName("User");
        newUser.setRole(Role.USER);
        newUser.setActive(true);
        newUser.setCreatedAt(Instant.now());

        when(userService.createUser(any(CreateUserRequest.class))).thenReturn(newUser);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("new@example.com"));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = "ADMIN")
    void createUser_adminRole_invalidEmail_returns400WithFieldError() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
                "not-an-email", "Password1!", "New", "User", Role.USER);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = "ADMIN")
    void patchUser_adminRole_changesRole() throws Exception {
        UpdateUserRequest request = new UpdateUserRequest(Role.ADMIN, null);

        User updated = new User();
        updated.setId(1L);
        updated.setEmail("user@example.com");
        updated.setPassword("$2a$12$encoded");
        updated.setFirstName("Test");
        updated.setLastName("User");
        updated.setRole(Role.ADMIN);
        updated.setActive(true);
        updated.setCreatedAt(Instant.now());

        when(userService.updateUser(eq(1L), any(UpdateUserRequest.class))).thenReturn(updated);

        mockMvc.perform(patch("/api/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }
}
