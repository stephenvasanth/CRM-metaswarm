package com.crm.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private static final String SECRET = "test-secret-key-must-be-long-enough-for-hmac-256-minimum-32-chars";

    @BeforeEach
    void setUp() {
        JwtProperties props = new JwtProperties();
        props.setSecret(SECRET);
        props.setExpirationMs(8 * 60 * 60 * 1000L);
        jwtTokenProvider = new JwtTokenProvider(props);
    }

    @Test
    void generateTokenFromAuthentication_containsUsername() {
        UserDetails user = User.withUsername("alice@example.com")
                .password("hashed")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_USER")))
                .build();
        Authentication auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());

        String token = jwtTokenProvider.generateToken(auth);

        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.getUsernameFromToken(token)).isEqualTo("alice@example.com");
    }

    @Test
    void generateTokenFromUsername_isValid() {
        String token = jwtTokenProvider.generateToken("bob@example.com");

        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getUsernameFromToken(token)).isEqualTo("bob@example.com");
    }

    @Test
    void validateToken_returnsFalseForTamperedToken() {
        String token = jwtTokenProvider.generateToken("alice@example.com");
        String tampered = token + "garbage";

        assertThat(jwtTokenProvider.validateToken(tampered)).isFalse();
    }

    @Test
    void validateToken_returnsFalseForEmptyString() {
        assertThat(jwtTokenProvider.validateToken("")).isFalse();
    }

    @Test
    void validateToken_returnsFalseForExpiredToken() throws InterruptedException {
        JwtProperties shortLived = new JwtProperties();
        shortLived.setSecret(SECRET);
        shortLived.setExpirationMs(1L); // 1 ms — expires immediately
        JwtTokenProvider shortProvider = new JwtTokenProvider(shortLived);

        String token = shortProvider.generateToken("charlie@example.com");
        Thread.sleep(5);

        assertThat(shortProvider.validateToken(token)).isFalse();
    }

    @Test
    void validateToken_returnsFalseForMalformedToken() {
        assertThat(jwtTokenProvider.validateToken("not.a.jwt")).isFalse();
    }

    @Test
    void validateToken_returnsFalseForNullToken() {
        assertThat(jwtTokenProvider.validateToken(null)).isFalse();
    }
}
