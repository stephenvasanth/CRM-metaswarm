package com.crm.domain.company.dto;

import com.crm.domain.company.Company;

public record CompanyDto(Long id, String name) {

    public static CompanyDto from(Company company) {
        return new CompanyDto(company.getId(), company.getName());
    }
}
