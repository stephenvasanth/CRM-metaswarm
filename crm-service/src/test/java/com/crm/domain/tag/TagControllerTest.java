package com.crm.domain.tag;

import com.crm.config.SecurityConfig;
import com.crm.domain.tag.dto.CreateTagRequest;
import com.crm.domain.tag.dto.TagDto;
import com.crm.domain.user.UserService;
import com.crm.security.JwtAuthenticationFilter;
import com.crm.security.JwtProperties;
import com.crm.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TagController.class)
@Import({SecurityConfig.class, JwtTokenProvider.class, JwtProperties.class, JwtAuthenticationFilter.class})
class TagControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TagService tagService;

    @MockBean
    private UserService userService;

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void getAll_authenticated_returns200WithList() throws Exception {
        when(tagService.findAll()).thenReturn(List.of(new TagDto(1L, "VIP", "#6366F1")));

        mockMvc.perform(get("/api/tags"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].name").value("VIP"))
                .andExpect(jsonPath("$[0].colour").value("#6366F1"));
    }

    @Test
    void getAll_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/tags"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = "ADMIN")
    void create_adminRole_returns201() throws Exception {
        CreateTagRequest req = new CreateTagRequest("VIP", "#6366F1");
        when(tagService.createTag(any(CreateTagRequest.class)))
                .thenReturn(new TagDto(1L, "VIP", "#6366F1"));

        mockMvc.perform(post("/api/tags")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("VIP"));
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void create_userRole_returns403() throws Exception {
        CreateTagRequest req = new CreateTagRequest("VIP", "#6366F1");

        mockMvc.perform(post("/api/tags")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = "ADMIN")
    void delete_adminRole_returns204() throws Exception {
        doNothing().when(tagService).deleteTag(1L);

        mockMvc.perform(delete("/api/tags/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void delete_userRole_returns403() throws Exception {
        mockMvc.perform(delete("/api/tags/1"))
                .andExpect(status().isForbidden());
    }
}
