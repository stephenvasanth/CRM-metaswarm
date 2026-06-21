package com.crm.domain.contact.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record CreateContactRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        String email,
        String phone,
        String jobTitle,
        Long companyId,
        Long ownerId,
        List<Long> tagIds
) {
}
