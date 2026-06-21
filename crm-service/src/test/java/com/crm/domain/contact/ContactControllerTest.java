package com.crm.domain.contact;

import com.crm.config.SecurityConfig;
import com.crm.domain.contact.dto.ContactDto;
import com.crm.domain.contact.dto.CreateContactRequest;
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

@WebMvcTest(ContactController.class)
@Import({SecurityConfig.class, JwtTokenProvider.class, JwtProperties.class, JwtAuthenticationFilter.class})
class ContactControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ContactService contactService;

    @MockBean
    private UserService userService;

    private ContactDto testContactDto;

    @BeforeEach
    void setUp() {
        testContactDto = new ContactDto(
                1L, "Alice", "Smith", "alice@example.com", "555-1234",
                "Engineer", 1L, "Acme Corp", 1L, "John Owner",
                List.of(), Instant.now(), Instant.now());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void getAll_authenticated_returns200() throws Exception {
        when(contactService.findAll(anyInt(), anyInt(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(testContactDto)));

        mockMvc.perform(get("/api/contacts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].firstName").value("Alice"));
    }

    @Test
    void getAll_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/contacts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void getById_found_returns200() throws Exception {
        when(contactService.findById(1L)).thenReturn(testContactDto);

        mockMvc.perform(get("/api/contacts/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.firstName").value("Alice"));
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void create_validRequest_returns201() throws Exception {
        CreateContactRequest req = new CreateContactRequest(
                "Alice", "Smith", "alice@example.com", null, null, null, null, null);
        when(contactService.create(any(CreateContactRequest.class))).thenReturn(testContactDto);

        mockMvc.perform(post("/api/contacts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.firstName").value("Alice"));
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void create_missingFirstName_returns400() throws Exception {
        CreateContactRequest req = new CreateContactRequest(
                "", "Smith", null, null, null, null, null, null);

        mockMvc.perform(post("/api/contacts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void update_validRequest_returns200() throws Exception {
        CreateContactRequest req = new CreateContactRequest(
                "Updated", "Name", null, null, null, null, null, null);
        when(contactService.update(eq(1L), any(CreateContactRequest.class))).thenReturn(testContactDto);

        mockMvc.perform(put("/api/contacts/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void delete_existing_returns204() throws Exception {
        doNothing().when(contactService).delete(1L);

        mockMvc.perform(delete("/api/contacts/1"))
                .andExpect(status().isNoContent());
    }
}
