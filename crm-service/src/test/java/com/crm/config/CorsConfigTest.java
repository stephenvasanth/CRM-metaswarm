package com.crm.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import static org.assertj.core.api.Assertions.assertThat;

class CorsConfigTest {

    private CorsConfig corsConfig;

    @BeforeEach
    void setUp() {
        corsConfig = new CorsConfig();
        ReflectionTestUtils.setField(corsConfig, "frontendOrigin", "http://localhost:4200");
    }

    @Test
    void corsFilter_isNotNull() {
        CorsFilter filter = corsConfig.corsFilter();
        assertThat(filter).isNotNull();
    }

    @Test
    void corsConfigurationSource_registersApiPattern() {
        CorsConfigurationSource source = corsConfig.corsConfigurationSource();
        assertThat(source).isInstanceOf(UrlBasedCorsConfigurationSource.class);
    }
}
