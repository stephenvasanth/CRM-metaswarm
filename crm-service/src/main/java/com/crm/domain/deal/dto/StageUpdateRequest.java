package com.crm.domain.deal.dto;

import com.crm.domain.deal.DealStage;
import jakarta.validation.constraints.NotNull;

public record StageUpdateRequest(
        @NotNull DealStage stage
) {
}
