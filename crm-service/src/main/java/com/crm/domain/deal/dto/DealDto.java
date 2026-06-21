package com.crm.domain.deal.dto;

import com.crm.domain.deal.Deal;
import com.crm.domain.deal.DealStage;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record DealDto(
        Long id,
        String title,
        BigDecimal value,
        DealStage stage,
        LocalDate expectedClose,
        Long contactId,
        String contactName,
        Long ownerId,
        String ownerName,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static DealDto from(Deal d) {
        return new DealDto(
                d.getId(),
                d.getTitle(),
                d.getValue(),
                d.getStage(),
                d.getExpectedClose(),
                d.getContact() != null ? d.getContact().getId() : null,
                d.getContact() != null ? (d.getContact().getFirstName() + " " + d.getContact().getLastName()) : null,
                d.getOwner() != null ? d.getOwner().getId() : null,
                d.getOwner() != null ? (d.getOwner().getFirstName() + " " + d.getOwner().getLastName()) : null,
                d.getNotes(),
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }
}
