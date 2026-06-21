package com.crm.domain.activity;

import com.crm.domain.activity.dto.ActivityDto;
import com.crm.domain.activity.dto.CreateActivityRequest;
import com.crm.domain.contact.ContactRepository;
import com.crm.domain.deal.DealRepository;
import com.crm.domain.user.UserRepository;
import com.crm.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@Transactional
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final ContactRepository contactRepository;
    private final DealRepository dealRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public ActivityService(ActivityRepository activityRepository,
                           ContactRepository contactRepository,
                           DealRepository dealRepository,
                           UserRepository userRepository,
                           RedisTemplate<String, Object> redisTemplate) {
        this.activityRepository = activityRepository;
        this.contactRepository = contactRepository;
        this.dealRepository = dealRepository;
        this.userRepository = userRepository;
        this.redisTemplate = redisTemplate;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public Page<ActivityDto> findAll(int page, int size) {
        String cacheKey = "activities:page:" + page + ":" + size;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return (Page<ActivityDto>) cached;
        }
        Page<ActivityDto> result = activityRepository
                .findAllByOrderByOccurredAtDesc(PageRequest.of(page, size))
                .map(ActivityDto::from);
        redisTemplate.opsForValue().set(cacheKey, result, 24, TimeUnit.HOURS);
        return result;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<ActivityDto> findByContactId(Long contactId) {
        String cacheKey = "activities:contact:" + contactId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return (List<ActivityDto>) cached;
        }
        List<ActivityDto> result = activityRepository
                .findByContactIdOrderByOccurredAtDesc(contactId)
                .stream().map(ActivityDto::from).toList();
        redisTemplate.opsForValue().set(cacheKey, result, 24, TimeUnit.HOURS);
        return result;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<ActivityDto> findByDealId(Long dealId) {
        String cacheKey = "activities:deal:" + dealId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return (List<ActivityDto>) cached;
        }
        List<ActivityDto> result = activityRepository
                .findByDealIdOrderByOccurredAtDesc(dealId)
                .stream().map(ActivityDto::from).toList();
        redisTemplate.opsForValue().set(cacheKey, result, 24, TimeUnit.HOURS);
        return result;
    }

    public ActivityDto create(CreateActivityRequest request) {
        Activity activity = new Activity();
        activity.setSubject(request.subject());
        activity.setType(request.type());
        activity.setNotes(request.notes());
        activity.setOccurredAt(request.occurredAt());
        if (request.contactId() != null) {
            activity.setContact(contactRepository.findById(request.contactId()).orElse(null));
        }
        if (request.dealId() != null) {
            activity.setDeal(dealRepository.findById(request.dealId()).orElse(null));
        }
        if (request.authorId() != null) {
            activity.setAuthor(userRepository.findById(request.authorId()).orElse(null));
        }
        Activity saved = activityRepository.save(activity);
        invalidateCache();
        return ActivityDto.from(saved);
    }

    public void delete(Long id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity", id));
        activityRepository.delete(activity);
        invalidateCache();
    }

    private void invalidateCache() {
        Set<String> keys = redisTemplate.keys("activities:*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
