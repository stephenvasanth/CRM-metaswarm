package com.crm.domain.company;

import com.crm.config.SecurityConfig;
import com.crm.domain.company.dto.CompanyDto;
import com.crm.domain.user.UserService;
import com.crm.security.JwtAuthenticationFilter;
import com.crm.security.JwtProperties;
import com.crm.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CompanyController.class)
@Import({SecurityConfig.class, JwtTokenProvider.class, JwtProperties.class, JwtAuthenticationFilter.class})
class CompanyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CompanyService companyService;

    @MockBean
    private UserService userService;

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void getAll_authenticated_returns200WithList() throws Exception {
        when(companyService.findAll()).thenReturn(List.of(new CompanyDto(1L, "Acme Corp")));

        mockMvc.perform(get("/api/companies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].name").value("Acme Corp"));
    }

    @Test
    void getAll_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/companies"))
                .andExpect(status().isUnauthorized());
    }
}
