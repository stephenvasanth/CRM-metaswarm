package com.crm.domain.contact.dto;

import com.crm.domain.contact.Contact;

public record ContactSummaryDto(
        Long id,
        String firstName,
        String lastName,
        String email,
        String companyName
) {
    public static ContactSummaryDto from(Contact c) {
        return new ContactSummaryDto(
                c.getId(),
                c.getFirstName(),
                c.getLastName(),
                c.getEmail(),
                c.getCompany() != null ? c.getCompany().getName() : null
        );
    }
}
