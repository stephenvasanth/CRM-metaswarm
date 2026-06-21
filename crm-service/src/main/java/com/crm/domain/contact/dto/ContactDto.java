package com.crm.domain.contact.dto;

import com.crm.domain.contact.Contact;
import com.crm.domain.tag.dto.TagDto;

import java.time.Instant;
import java.util.List;

public record ContactDto(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        String jobTitle,
        Long companyId,
        String companyName,
        Long ownerId,
        String ownerName,
        List<TagDto> tags,
        Instant createdAt,
        Instant updatedAt
) {
    public static ContactDto from(Contact c) {
        return new ContactDto(
                c.getId(),
                c.getFirstName(),
                c.getLastName(),
                c.getEmail(),
                c.getPhone(),
                c.getJobTitle(),
                c.getCompany() != null ? c.getCompany().getId() : null,
                c.getCompany() != null ? c.getCompany().getName() : null,
                c.getOwner() != null ? c.getOwner().getId() : null,
                c.getOwner() != null ? (c.getOwner().getFirstName() + " " + c.getOwner().getLastName()) : null,
                c.getTags().stream().map(TagDto::from).toList(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
