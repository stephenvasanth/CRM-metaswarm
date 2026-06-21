package com.crm.domain.auth;

import com.crm.domain.auth.dto.LoginRequest;
import com.crm.domain.auth.dto.LoginResponse;
import com.crm.domain.user.User;
import com.crm.domain.user.UserRepository;
import com.crm.domain.user.dto.UserDto;
import com.crm.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtTokenProvider jwtTokenProvider,
                       UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
    }

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalStateException("User not found after successful authentication"));

        String token = jwtTokenProvider.generateToken(request.email(), user.getRole().name());

        return new LoginResponse(token, UserDto.from(user));
    }
}
