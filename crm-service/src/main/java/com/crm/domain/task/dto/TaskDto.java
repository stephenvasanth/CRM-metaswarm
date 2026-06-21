package com.crm.domain.task.dto;

import com.crm.domain.task.Task;

import java.time.Instant;
import java.time.LocalDate;

public record TaskDto(
        Long id,
        String title,
        String description,
        LocalDate dueDate,
        boolean completed,
        Long assigneeId,
        String assigneeName,
        Long contactId,
        String contactName,
        Long dealId,
        String dealTitle,
        Instant createdAt,
        Instant updatedAt
) {
    public static TaskDto from(Task t) {
        return new TaskDto(
                t.getId(),
                t.getTitle(),
                t.getDescription(),
                t.getDueDate(),
                t.isCompleted(),
                t.getAssignee() != null ? t.getAssignee().getId() : null,
                t.getAssignee() != null ? t.getAssignee().getFirstName() + " " + t.getAssignee().getLastName() : null,
                t.getContact() != null ? t.getContact().getId() : null,
                t.getContact() != null ? t.getContact().getFirstName() + " " + t.getContact().getLastName() : null,
                t.getDeal() != null ? t.getDeal().getId() : null,
                t.getDeal() != null ? t.getDeal().getTitle() : null,
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
