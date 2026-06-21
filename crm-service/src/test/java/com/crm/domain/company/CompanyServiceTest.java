package com.crm.domain.company;

import com.crm.domain.company.dto.CompanyDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CompanyServiceTest {

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOps;

    @InjectMocks
    private CompanyService companyService;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    @Test
    void findAll_cacheHit_returnsFromRedis() {
        List<CompanyDto> cached = List.of(new CompanyDto(1L, "Acme Corp"));
        when(valueOps.get("companies:all")).thenReturn(cached);

        List<CompanyDto> result = companyService.findAll();

        assertThat(result).isEqualTo(cached);
        verify(companyRepository, never()).findAll();
    }

    @Test
    void findAll_cacheMiss_fetchesFromDbAndCaches() {
        when(valueOps.get("companies:all")).thenReturn(null);

        Company company = new Company();
        company.setId(1L);
        company.setName("Acme Corp");

        when(companyRepository.findAll()).thenReturn(List.of(company));

        List<CompanyDto> result = companyService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(1L);
        assertThat(result.get(0).name()).isEqualTo("Acme Corp");
        verify(valueOps).set(eq("companies:all"), any(), eq(24L), eq(TimeUnit.HOURS));
    }

    @Test
    void company_setterGetterCoverage() {
        java.time.Instant now = java.time.Instant.now();
        Company c = new Company();
        c.setId(1L);
        c.setName("Test");
        c.setCreatedAt(now);
        c.setUpdatedAt(now);
        assertThat(c.getId()).isEqualTo(1L);
        assertThat(c.getName()).isEqualTo("Test");
        assertThat(c.getCreatedAt()).isEqualTo(now);
        assertThat(c.getUpdatedAt()).isEqualTo(now);
    }
}
