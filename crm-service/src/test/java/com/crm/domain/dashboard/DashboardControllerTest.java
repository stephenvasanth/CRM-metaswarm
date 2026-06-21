package com.crm.domain.dashboard;

import com.crm.config.SecurityConfig;
import com.crm.domain.activity.ActivityService;
import com.crm.domain.contact.ContactService;
import com.crm.domain.deal.DealService;
import com.crm.domain.tag.TagService;
import com.crm.domain.task.TaskService;
import com.crm.domain.user.UserService;
import com.crm.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DashboardController.class)
@Import(SecurityConfig.class)
class DashboardControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private DashboardService dashboardService;
    @MockBean private UserService userService;
    @MockBean private ContactService contactService;
    @MockBean private DealService dealService;
    @MockBean private ActivityService activityService;
    @MockBean private TaskService taskService;
    @MockBean private TagService tagService;
    @MockBean private JwtTokenProvider jwtTokenProvider;

    private DashboardDto sampleDto() {
        return new DashboardDto(
                3L,
                BigDecimal.valueOf(15000),
                2L,
                5L,
                List.of(new DashboardDto.DealStageStats("LEAD", 3L, BigDecimal.valueOf(15000))),
                List.of(),
                List.of()
        );
    }

    @Test
    @WithMockUser
    void getDashboard_returnsOk() throws Exception {
        when(dashboardService.getDashboard()).thenReturn(sampleDto());

        mockMvc.perform(get("/api/dashboard").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openDealsCount").value(3))
                .andExpect(jsonPath("$.pipelineValue").value(15000))
                .andExpect(jsonPath("$.tasksDueToday").value(2))
                .andExpect(jsonPath("$.newContactsLast7Days").value(5))
                .andExpect(jsonPath("$.dealsByStage[0].stage").value("LEAD"))
                .andExpect(jsonPath("$.dealsByStage[0].count").value(3));
    }

    @Test
    void getDashboard_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isUnauthorized());
    }
}
