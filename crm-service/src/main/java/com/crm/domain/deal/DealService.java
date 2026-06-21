package com.crm.domain.deal;

import com.crm.domain.contact.ContactRepository;
import com.crm.domain.deal.dto.CreateDealRequest;
import com.crm.domain.deal.dto.DealDto;
import com.crm.domain.deal.dto.DealStatsDto;
import com.crm.domain.user.UserRepository;
import com.crm.exception.ResourceNotFoundException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
@Service
@Transactional
public class DealService {

    private final DealRepository dealRepository;
    private final ContactRepository contactRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public DealService(DealRepository dealRepository,
                       ContactRepository contactRepository,
                       UserRepository userRepository,
                       RedisTemplate<String, Object> redisTemplate) {
        this.dealRepository = dealRepository;
        this.contactRepository = contactRepository;
        this.userRepository = userRepository;
        this.redisTemplate = redisTemplate;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<DealDto> findAll() {
        Object cached = redisTemplate.opsForValue().get("deals:all");
        if (cached != null) {
            return (List<DealDto>) cached;
        }
        List<DealDto> result = new ArrayList<>(dealRepository.findAll().stream()
                .map(DealDto::from)
                .toList());
        redisTemplate.opsForValue().set("deals:all", result, 24, TimeUnit.HOURS);
        return result;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public DealDto findById(Long id) {
        String cacheKey = "deals:id:" + id;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return (DealDto) cached;
        }
        Deal deal = dealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deal", id));
        DealDto dto = DealDto.from(deal);
        redisTemplate.opsForValue().set(cacheKey, dto, 24, TimeUnit.HOURS);
        return dto;
    }

    public DealDto create(CreateDealRequest request) {
        Deal deal = new Deal();
        applyFields(deal, request);
        Deal saved = dealRepository.save(deal);
        invalidateDealCache();
        return DealDto.from(saved);
    }

    public DealDto update(Long id, CreateDealRequest request) {
        Deal deal = dealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deal", id));
        applyFields(deal, request);
        Deal saved = dealRepository.save(deal);
        invalidateDealCache();
        return DealDto.from(saved);
    }

    public DealDto updateStage(Long id, DealStage stage) {
        Deal deal = dealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deal", id));
        deal.setStage(stage);
        Deal saved = dealRepository.save(deal);
        invalidateDealCache();
        return DealDto.from(saved);
    }

    public void delete(Long id) {
        Deal deal = dealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deal", id));
        dealRepository.delete(deal);
        invalidateDealCache();
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public DealStatsDto getStats() {
        Object cached = redisTemplate.opsForValue().get("deals:stats");
        if (cached != null) {
            return (DealStatsDto) cached;
        }

        List<Object[]> rawStats = dealRepository.getStatsByStage();
        // Build a map from stage -> stats for quick lookup
        Map<DealStage, DealStatsDto.StageStats> statsMap = rawStats.stream()
                .collect(Collectors.toMap(
                        row -> (DealStage) row[0],
                        row -> new DealStatsDto.StageStats(
                                (DealStage) row[0],
                                ((Number) row[1]).longValue(),
                                row[2] instanceof BigDecimal bd ? bd : new BigDecimal(row[2].toString())
                        )
                ));

        // Ensure all 6 stages are represented, defaulting to 0 if missing
        List<DealStatsDto.StageStats> stages = new ArrayList<>();
        for (DealStage stage : DealStage.values()) {
            stages.add(statsMap.getOrDefault(stage,
                    new DealStatsDto.StageStats(stage, 0L, BigDecimal.ZERO)));
        }

        DealStatsDto result = new DealStatsDto(stages);
        redisTemplate.opsForValue().set("deals:stats", result, 24, TimeUnit.HOURS);
        return result;
    }

    private void applyFields(Deal deal, CreateDealRequest request) {
        deal.setTitle(request.title());
        deal.setValue(request.value() != null ? request.value() : BigDecimal.ZERO);
        deal.setStage(request.stage() != null ? request.stage() : DealStage.LEAD);
        deal.setExpectedClose(request.expectedClose());
        deal.setNotes(request.notes());

        if (request.contactId() != null) {
            deal.setContact(contactRepository.findById(request.contactId()).orElse(null));
        } else {
            deal.setContact(null);
        }

        if (request.ownerId() != null) {
            deal.setOwner(userRepository.findById(request.ownerId()).orElse(null));
        } else {
            deal.setOwner(null);
        }
    }

    private void invalidateDealCache() {
        Set<String> keys = redisTemplate.keys("deals:*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
