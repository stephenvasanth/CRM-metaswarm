package com.crm.domain.user.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        String firstName,
        String lastName,
        @Size(min = 8) String password
) {
}
