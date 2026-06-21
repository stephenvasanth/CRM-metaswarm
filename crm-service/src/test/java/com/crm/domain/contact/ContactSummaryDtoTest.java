package com.crm.domain.contact;

import com.crm.domain.company.Company;
import com.crm.domain.contact.dto.ContactSummaryDto;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ContactSummaryDtoTest {

    @Test
    void from_contactWithCompany_mapsAllFields() {
        Company company = new Company();
        company.setId(1L);
        company.setName("Acme Corp");

        Contact contact = new Contact();
        contact.setId(1L);
        contact.setFirstName("Alice");
        contact.setLastName("Smith");
        contact.setEmail("alice@example.com");
        contact.setCompany(company);

        ContactSummaryDto dto = ContactSummaryDto.from(contact);

        assertThat(dto.id()).isEqualTo(1L);
        assertThat(dto.firstName()).isEqualTo("Alice");
        assertThat(dto.lastName()).isEqualTo("Smith");
        assertThat(dto.email()).isEqualTo("alice@example.com");
        assertThat(dto.companyName()).isEqualTo("Acme Corp");
    }

    @Test
    void from_contactWithoutCompany_returnsNullCompanyName() {
        Contact contact = new Contact();
        contact.setId(2L);
        contact.setFirstName("Bob");
        contact.setLastName("Jones");

        ContactSummaryDto dto = ContactSummaryDto.from(contact);

        assertThat(dto.companyName()).isNull();
    }
}
