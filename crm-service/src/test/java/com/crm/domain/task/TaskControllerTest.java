package com.crm.domain.task;

import com.crm.config.SecurityConfig;
import com.crm.domain.task.dto.CompleteTaskRequest;
import com.crm.domain.task.dto.CreateTaskRequest;
import com.crm.domain.task.dto.TaskDto;
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
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TaskController.class)
@Import({SecurityConfig.class, JwtTokenProvider.class, JwtProperties.class, JwtAuthenticationFilter.class})
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TaskService taskService;

    @MockBean
    private UserService userService;

    private TaskDto testDto;

    @BeforeEach
    void setUp() {
        testDto = new TaskDto(
                1L, "Follow up call", "Description", LocalDate.now().plusDays(7),
                false, 1L, "John Assignee", 1L, "Alice Smith", 1L, "Big Deal",
                Instant.now(), Instant.now());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void getAll_authenticated_returns200() throws Exception {
        when(taskService.findAll(anyInt(), anyInt(), any()))
                .thenReturn(new PageImpl<>(List.of(testDto)));

        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Follow up call"));
    }

    @Test
    void getAll_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void create_validRequest_returns201() throws Exception {
        CreateTaskRequest req = new CreateTaskRequest(
                "Follow up call", "Description", LocalDate.now().plusDays(7), 1L, 1L, 1L);
        when(taskService.create(any(CreateTaskRequest.class))).thenReturn(testDto);

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Follow up call"));
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void create_missingTitle_returns400() throws Exception {
        CreateTaskRequest req = new CreateTaskRequest("", null, null, null, null, null);

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void update_validRequest_returns200() throws Exception {
        CreateTaskRequest req = new CreateTaskRequest("Updated task", null, null, null, null, null);
        when(taskService.update(eq(1L), any(CreateTaskRequest.class))).thenReturn(testDto);

        mockMvc.perform(put("/api/tasks/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void complete_returns200() throws Exception {
        CompleteTaskRequest req = new CompleteTaskRequest(true);
        when(taskService.complete(eq(1L), eq(true))).thenReturn(testDto);

        mockMvc.perform(patch("/api/tasks/1/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void delete_existing_returns204() throws Exception {
        doNothing().when(taskService).delete(1L);

        mockMvc.perform(delete("/api/tasks/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void delete_unauthenticated_returns401() throws Exception {
        mockMvc.perform(delete("/api/tasks/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void getByContact_authenticated_returns200() throws Exception {
        when(taskService.findByContactId(1L)).thenReturn(List.of(testDto));

        mockMvc.perform(get("/api/contacts/1/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Follow up call"));
    }

    @Test
    void getByContact_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/contacts/1/tasks"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void getByDeal_authenticated_returns200() throws Exception {
        when(taskService.findByDealId(1L)).thenReturn(List.of(testDto));

        mockMvc.perform(get("/api/deals/1/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].dealTitle").value("Big Deal"));
    }

    @Test
    void getByDeal_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/deals/1/tasks"))
                .andExpect(status().isUnauthorized());
    }
}
