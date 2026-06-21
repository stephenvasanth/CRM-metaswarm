package com.crm.domain.deal.dto;

import com.crm.domain.deal.DealStage;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateDealRequest(
        @NotBlank String title,
        BigDecimal value,
        DealStage stage,
        LocalDate expectedClose,
        Long contactId,
        Long ownerId,
        String notes
) {
}
