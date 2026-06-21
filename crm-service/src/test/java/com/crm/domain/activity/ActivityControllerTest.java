package com.crm.domain.activity;

import com.crm.config.SecurityConfig;
import com.crm.domain.activity.dto.ActivityDto;
import com.crm.domain.activity.dto.CreateActivityRequest;
import com.crm.domain.user.UserService;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ActivityController.class)
@Import({SecurityConfig.class, JwtTokenProvider.class, JwtProperties.class, JwtAuthenticationFilter.class})
class ActivityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ActivityService activityService;

    @MockBean
    private UserService userService;

    private ActivityDto testDto;

    @BeforeEach
    void setUp() {
        testDto = new ActivityDto(
                1L, ActivityType.CALL, "Discovery call", "Notes", Instant.now(),
                1L, "Alice Smith", 1L, "Big Deal", 1L, "John Author", Instant.now());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void getAll_authenticated_returns200() throws Exception {
        when(activityService.findAll(anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of(testDto)));

        mockMvc.perform(get("/api/activities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].subject").value("Discovery call"));
    }

    @Test
    void getAll_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/activities"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void create_validRequest_returns201() throws Exception {
        CreateActivityRequest req = new CreateActivityRequest(
                "Discovery call", ActivityType.CALL, "Notes", Instant.now(), 1L, 1L, 1L);
        when(activityService.create(any(CreateActivityRequest.class))).thenReturn(testDto);

        mockMvc.perform(post("/api/activities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.subject").value("Discovery call"));
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void create_missingSubject_returns400() throws Exception {
        CreateActivityRequest req = new CreateActivityRequest(
                "", ActivityType.CALL, null, null, null, null, null);

        mockMvc.perform(post("/api/activities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void delete_existing_returns204() throws Exception {
        doNothing().when(activityService).delete(1L);

        mockMvc.perform(delete("/api/activities/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void delete_unauthenticated_returns401() throws Exception {
        mockMvc.perform(delete("/api/activities/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void getByContact_authenticated_returns200() throws Exception {
        when(activityService.findByContactId(1L)).thenReturn(List.of(testDto));

        mockMvc.perform(get("/api/contacts/1/activities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].subject").value("Discovery call"));
    }

    @Test
    void getByContact_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/contacts/1/activities"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void getByDeal_authenticated_returns200() throws Exception {
        when(activityService.findByDealId(1L)).thenReturn(List.of(testDto));

        mockMvc.perform(get("/api/deals/1/activities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].dealTitle").value("Big Deal"));
    }

    @Test
    void getByDeal_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/deals/1/activities"))
                .andExpect(status().isUnauthorized());
    }
}
