package com.crm.domain.auth;

import com.crm.config.SecurityConfig;
import com.crm.domain.auth.dto.LoginRequest;
import com.crm.domain.auth.dto.LoginResponse;
import com.crm.domain.user.Role;
import com.crm.domain.user.User;
import com.crm.domain.user.UserService;
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
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtTokenProvider.class, JwtProperties.class, JwtAuthenticationFilter.class})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private UserService userService;

    private UserDto testUserDto;

    @BeforeEach
    void setUp() {
        User testUser = new User();
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
    void login_validRequest_returns200WithTokenAndUser() throws Exception {
        LoginRequest request = new LoginRequest("user@example.com", "Password1!");
        LoginResponse response = new LoginResponse("test.jwt.token", testUserDto);

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("test.jwt.token"))
                .andExpect(jsonPath("$.user.email").value("user@example.com"));
    }

    @Test
    void login_missingEmail_returns400() throws Exception {
        String body = "{\"password\": \"Password1!\"}";

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void login_invalidEmail_returns400() throws Exception {
        LoginRequest request = new LoginRequest("not-an-email", "Password1!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void login_badCredentials_returns401WithGenericMessage() throws Exception {
        LoginRequest request = new LoginRequest("user@example.com", "wrongpassword");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"))
                // Generic message - should not reveal which field was wrong
                .andExpect(jsonPath("$.error.message").value("Invalid email or password"));
    }

    @Test
    void login_responseDoesNotContainRawPassword() throws Exception {
        LoginRequest request = new LoginRequest("user@example.com", "Password1!");
        LoginResponse response = new LoginResponse("test.jwt.token", testUserDto);

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string(not(containsString("Password1!"))))
                .andExpect(content().string(not(containsString("\"password\":"))))
                .andExpect(content().string(not(containsString("$2a$12"))));
    }
}
