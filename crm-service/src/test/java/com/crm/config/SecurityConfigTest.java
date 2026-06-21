package com.crm.config;

import com.crm.config.PasswordEncoderConfig;
import com.crm.domain.activity.ActivityService;
import com.crm.domain.auth.AuthService;
import com.crm.domain.dashboard.DashboardService;
import com.crm.domain.company.CompanyService;
import com.crm.domain.contact.ContactService;
import com.crm.domain.deal.DealService;
import com.crm.domain.tag.TagService;
import com.crm.domain.task.TaskService;
import com.crm.domain.user.UserService;
import com.crm.security.JwtAuthenticationFilter;
import com.crm.security.JwtProperties;
import com.crm.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest
@Import({SecurityConfig.class, PasswordEncoderConfig.class, JwtTokenProvider.class, JwtProperties.class,
        JwtAuthenticationFilter.class})
class SecurityConfigTest {

    @MockBean
    private UserService userService;

    @MockBean
    private AuthService authService;

    @MockBean
    private CompanyService companyService;

    @MockBean
    private ContactService contactService;

    @MockBean
    private DealService dealService;

    @MockBean
    private TagService tagService;

    @MockBean
    private ActivityService activityService;

    @MockBean
    private TaskService taskService;

    @MockBean
    private DashboardService dashboardService;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void passwordEncoder_isBCrypt() throws Exception {
        assertThat(passwordEncoder).isInstanceOf(BCryptPasswordEncoder.class);
    }

    @Test
    void passwordEncoder_encodesAndVerifies() throws Exception {
        String raw = "mySecurePassword123";
        String encoded = passwordEncoder.encode(raw);
        assertThat(passwordEncoder.matches(raw, encoded)).isTrue();
    }

    @Test
    void protectedEndpoint_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/contacts"))
                .andExpect(status().isUnauthorized());
    }
}
