package com.crm.domain.deal;

import com.crm.config.SecurityConfig;
import com.crm.domain.deal.dto.CreateDealRequest;
import com.crm.domain.deal.dto.DealDto;
import com.crm.domain.deal.dto.DealStatsDto;
import com.crm.domain.deal.dto.StageUpdateRequest;
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
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DealController.class)
@Import({SecurityConfig.class, JwtTokenProvider.class, JwtProperties.class, JwtAuthenticationFilter.class})
class DealControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DealService dealService;

    @MockBean
    private UserService userService;

    private DealDto testDealDto;

    @BeforeEach
    void setUp() {
        testDealDto = new DealDto(
                1L, "Big Deal", new BigDecimal("5000.00"), DealStage.LEAD,
                null, 1L, "Alice Smith", 1L, "John Owner", "Notes",
                Instant.now(), Instant.now());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void getAll_authenticated_returns200() throws Exception {
        when(dealService.findAll()).thenReturn(List.of(testDealDto));

        mockMvc.perform(get("/api/deals"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Big Deal"));
    }

    @Test
    void getAll_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/deals"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void getStats_returns200() throws Exception {
        DealStatsDto.StageStats leadStats = new DealStatsDto.StageStats(DealStage.LEAD, 2L, new BigDecimal("10000"));
        DealStatsDto stats = new DealStatsDto(List.of(leadStats));
        when(dealService.getStats()).thenReturn(stats);

        mockMvc.perform(get("/api/deals/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stages[0].stage").value("LEAD"))
                .andExpect(jsonPath("$.stages[0].count").value(2));
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void getById_found_returns200() throws Exception {
        when(dealService.findById(1L)).thenReturn(testDealDto);

        mockMvc.perform(get("/api/deals/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void create_validRequest_returns201() throws Exception {
        CreateDealRequest req = new CreateDealRequest(
                "New Deal", new BigDecimal("1000"), DealStage.LEAD, null, null, null, null);
        when(dealService.create(any(CreateDealRequest.class))).thenReturn(testDealDto);

        mockMvc.perform(post("/api/deals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Big Deal"));
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void create_missingTitle_returns400() throws Exception {
        CreateDealRequest req = new CreateDealRequest(
                "", new BigDecimal("1000"), DealStage.LEAD, null, null, null, null);

        mockMvc.perform(post("/api/deals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void update_validRequest_returns200() throws Exception {
        CreateDealRequest req = new CreateDealRequest(
                "Updated", new BigDecimal("9999"), DealStage.PROPOSAL, null, null, null, null);
        when(dealService.update(eq(1L), any(CreateDealRequest.class))).thenReturn(testDealDto);

        mockMvc.perform(put("/api/deals/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void patchStage_validStage_returns200() throws Exception {
        StageUpdateRequest stageReq = new StageUpdateRequest(DealStage.QUALIFIED);
        when(dealService.updateStage(eq(1L), eq(DealStage.QUALIFIED))).thenReturn(testDealDto);

        mockMvc.perform(patch("/api/deals/1/stage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(stageReq)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void patchStage_nullStage_returns400() throws Exception {
        StageUpdateRequest stageReq = new StageUpdateRequest(null);

        mockMvc.perform(patch("/api/deals/1/stage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(stageReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void delete_existing_returns204() throws Exception {
        doNothing().when(dealService).delete(1L);

        mockMvc.perform(delete("/api/deals/1"))
                .andExpect(status().isNoContent());
    }
}
