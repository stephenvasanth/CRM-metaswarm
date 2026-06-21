package com.crm.domain.company;

import com.crm.domain.company.dto.CompanyDto;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@Transactional
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public CompanyService(CompanyRepository companyRepository,
                          RedisTemplate<String, Object> redisTemplate) {
        this.companyRepository = companyRepository;
        this.redisTemplate = redisTemplate;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<CompanyDto> findAll() {
        Object cached = redisTemplate.opsForValue().get("companies:all");
        if (cached != null) {
            return (List<CompanyDto>) cached;
        }
        List<CompanyDto> result = companyRepository.findAll().stream()
                .map(CompanyDto::from)
                .toList();
        redisTemplate.opsForValue().set("companies:all", result, 24, TimeUnit.HOURS);
        return result;
    }
}
