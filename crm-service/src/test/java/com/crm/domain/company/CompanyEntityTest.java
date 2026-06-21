package com.crm.domain.company;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class CompanyEntityTest {

    @Test
    void onCreate_setsTimestamps() throws Exception {
        Company company = new Company();
        Method onCreate = Company.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(company);

        assertThat(company.getCreatedAt()).isNotNull();
        assertThat(company.getUpdatedAt()).isNotNull();
    }

    @Test
    void onUpdate_setsUpdatedAt() throws Exception {
        Company company = new Company();
        Method onUpdate = Company.class.getDeclaredMethod("onUpdate");
        onUpdate.setAccessible(true);
        onUpdate.invoke(company);

        assertThat(company.getUpdatedAt()).isNotNull();
    }
}
