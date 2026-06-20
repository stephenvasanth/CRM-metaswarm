package com.crm.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StubUserDetailsServiceTest {

    @Test
    void loadUserByUsername_alwaysThrowsUsernameNotFoundException() {
        StubUserDetailsService service = new StubUserDetailsService();

        assertThatThrownBy(() -> service.loadUserByUsername("anyone@example.com"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("anyone@example.com");
    }
}
