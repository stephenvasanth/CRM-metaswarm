package com.crm.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtPropertiesTest {

    @Test
    void defaultExpirationIsEightHours() {
        JwtProperties props = new JwtProperties();
        assertThat(props.getExpirationMs()).isEqualTo(8 * 60 * 60 * 1000L);
    }

    @Test
    void setAndGetSecret() {
        JwtProperties props = new JwtProperties();
        props.setSecret("my-secret-key");
        assertThat(props.getSecret()).isEqualTo("my-secret-key");
    }

    @Test
    void setAndGetExpirationMs() {
        JwtProperties props = new JwtProperties();
        props.setExpirationMs(3600000L);
        assertThat(props.getExpirationMs()).isEqualTo(3600000L);
    }
}
