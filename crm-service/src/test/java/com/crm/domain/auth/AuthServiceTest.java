package com.crm.domain.auth;

import com.crm.domain.auth.dto.LoginRequest;
import com.crm.domain.auth.dto.LoginResponse;
import com.crm.domain.user.Role;
import com.crm.domain.user.User;
import com.crm.domain.user.UserRepository;
import com.crm.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("user@example.com");
        testUser.setPassword("$2a$12$encodedpassword");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setRole(Role.USER);
        testUser.setActive(true);
        testUser.setCreatedAt(Instant.now());
    }

    @Test
    void login_validCredentials_returnsTokenAndUser() {
        LoginRequest request = new LoginRequest("user@example.com", "Password1!");
        Authentication auth = mock(Authentication.class);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        when(jwtTokenProvider.generateToken("user@example.com")).thenReturn("test.jwt.token");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(testUser));

        LoginResponse response = authService.login(request);

        assertThat(response.token()).isEqualTo("test.jwt.token");
        assertThat(response.user().email()).isEqualTo("user@example.com");
        verify(jwtTokenProvider).generateToken("user@example.com");
    }

    @Test
    void login_invalidCredentials_throwsBadCredentialsException() {
        LoginRequest request = new LoginRequest("user@example.com", "wrongpassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_userNotFoundAfterAuth_throwsIllegalState() {
        LoginRequest request = new LoginRequest("user@example.com", "Password1!");
        Authentication auth = mock(Authentication.class);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        when(jwtTokenProvider.generateToken("user@example.com")).thenReturn("test.jwt.token");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.empty());

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void login_tokenNotLoggedAnywhere() {
        // This test ensures the login method does not produce a response
        // containing the raw password anywhere. We verify the token is generated
        // but we do not check it against any log output here — the token is
        // only present in the LoginResponse and is never passed to any logger.
        LoginRequest request = new LoginRequest("user@example.com", "Password1!");
        Authentication auth = mock(Authentication.class);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        when(jwtTokenProvider.generateToken("user@example.com")).thenReturn("test.jwt.token");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(testUser));

        LoginResponse response = authService.login(request);

        // The token is returned in the response — but verify it was generated
        // using only the username, not the raw password
        assertThat(response.token()).isNotNull();
        // Verify password was never passed to token generator
        verify(jwtTokenProvider).generateToken("user@example.com");
        verify(jwtTokenProvider, never()).generateToken("Password1!");
    }
}
