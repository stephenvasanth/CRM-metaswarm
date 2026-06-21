package com.crm.domain.tag.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateTagRequest(
        @NotBlank String name,
        @NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Colour must be a valid hex colour (e.g. #6366F1)") String colour
) {
}
