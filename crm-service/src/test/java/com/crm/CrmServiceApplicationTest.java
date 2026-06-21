package com.crm;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;

import static org.mockito.Mockito.mockStatic;

class CrmServiceApplicationTest {

    @Test
    void main_invokesSpringApplicationRun() {
        try (var mocked = mockStatic(SpringApplication.class)) {
            mocked.when(() -> SpringApplication.run(CrmServiceApplication.class, new String[]{}))
                    .thenReturn(null);
            CrmServiceApplication.main(new String[]{});
            mocked.verify(() -> SpringApplication.run(CrmServiceApplication.class, new String[]{}));
        }
    }
}
