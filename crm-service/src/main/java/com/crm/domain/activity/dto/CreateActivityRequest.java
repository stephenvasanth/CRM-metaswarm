package com.crm.domain.activity.dto;

import com.crm.domain.activity.ActivityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record CreateActivityRequest(
        @NotBlank String subject,
        @NotNull ActivityType type,
        String notes,
        Instant occurredAt,
        Long contactId,
        Long dealId,
        Long authorId
) {}
