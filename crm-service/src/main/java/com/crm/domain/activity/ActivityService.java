package com.crm.domain.activity;

import com.crm.domain.activity.dto.ActivityDto;
import com.crm.domain.activity.dto.CreateActivityRequest;
import com.crm.domain.contact.ContactRepository;
import com.crm.domain.deal.DealRepository;
import com.crm.domain.user.UserRepository;
import com.crm.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final ContactRepository contactRepository;
    private final DealRepository dealRepository;
    private final UserRepository userRepository;

    public ActivityService(ActivityRepository activityRepository,
                           ContactRepository contactRepository,
                           DealRepository dealRepository,
                           UserRepository userRepository) {
        this.activityRepository = activityRepository;
        this.contactRepository = contactRepository;
        this.dealRepository = dealRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<ActivityDto> findAll(int page, int size) {
        return activityRepository
                .findAllByOrderByOccurredAtDesc(PageRequest.of(page, size))
                .map(ActivityDto::from);
    }

    @Transactional(readOnly = true)
    public List<ActivityDto> findByContactId(Long contactId) {
        return activityRepository
                .findByContactIdOrderByOccurredAtDesc(contactId)
                .stream().map(ActivityDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ActivityDto> findByDealId(Long dealId) {
        return activityRepository
                .findByDealIdOrderByOccurredAtDesc(dealId)
                .stream().map(ActivityDto::from).toList();
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
        return ActivityDto.from(activityRepository.save(activity));
    }

    public void delete(Long id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity", id));
        activityRepository.delete(activity);
    }
}
