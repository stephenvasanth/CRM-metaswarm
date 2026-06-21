package com.crm.domain.activity.dto;

import com.crm.domain.activity.Activity;
import com.crm.domain.activity.ActivityType;

import java.time.Instant;

public record ActivityDto(
        Long id,
        ActivityType type,
        String subject,
        String notes,
        Instant occurredAt,
        Long contactId,
        String contactName,
        Long dealId,
        String dealTitle,
        Long authorId,
        String authorName,
        Instant createdAt
) {
    public static ActivityDto from(Activity a) {
        return new ActivityDto(
                a.getId(),
                a.getType(),
                a.getSubject(),
                a.getNotes(),
                a.getOccurredAt(),
                a.getContact() != null ? a.getContact().getId() : null,
                a.getContact() != null ? a.getContact().getFirstName() + " " + a.getContact().getLastName() : null,
                a.getDeal() != null ? a.getDeal().getId() : null,
                a.getDeal() != null ? a.getDeal().getTitle() : null,
                a.getAuthor() != null ? a.getAuthor().getId() : null,
                a.getAuthor() != null ? a.getAuthor().getFirstName() + " " + a.getAuthor().getLastName() : null,
                a.getCreatedAt()
        );
    }
}
