package com.crm.domain.activity;

import com.crm.domain.activity.dto.ActivityDto;
import com.crm.domain.activity.dto.CreateActivityRequest;
import com.crm.domain.contact.Contact;
import com.crm.domain.contact.ContactRepository;
import com.crm.domain.deal.Deal;
import com.crm.domain.deal.DealRepository;
import com.crm.domain.user.User;
import com.crm.domain.user.UserRepository;
import com.crm.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityServiceTest {

    @Mock private ActivityRepository activityRepository;
    @Mock private ContactRepository contactRepository;
    @Mock private DealRepository dealRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private ActivityService activityService;

    private Activity testActivity;
    private Contact testContact;
    private Deal testDeal;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setFirstName("John");
        testUser.setLastName("Author");

        testContact = new Contact();
        testContact.setId(1L);
        testContact.setFirstName("Alice");
        testContact.setLastName("Smith");

        testDeal = new Deal();
        testDeal.setId(1L);
        testDeal.setTitle("Big Deal");

        testActivity = new Activity();
        testActivity.setId(1L);
        testActivity.setType(ActivityType.CALL);
        testActivity.setSubject("Discovery call");
        testActivity.setNotes("Went well");
        testActivity.setOccurredAt(Instant.now());
        testActivity.setContact(testContact);
        testActivity.setDeal(testDeal);
        testActivity.setAuthor(testUser);
        testActivity.setCreatedAt(Instant.now());
    }

    @Test
    void findAll_returnsPageFromRepository() {
        Page<Activity> page = new PageImpl<>(List.of(testActivity));
        when(activityRepository.findAllByOrderByOccurredAtDesc(any(Pageable.class))).thenReturn(page);

        Page<ActivityDto> result = activityService.findAll(0, 20);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).subject()).isEqualTo("Discovery call");
        assertThat(result.getContent().get(0).contactId()).isEqualTo(1L);
        assertThat(result.getContent().get(0).dealId()).isEqualTo(1L);
        assertThat(result.getContent().get(0).authorId()).isEqualTo(1L);
    }

    @Test
    void findByContactId_returnsListFromRepository() {
        when(activityRepository.findByContactIdOrderByOccurredAtDesc(1L)).thenReturn(List.of(testActivity));

        List<ActivityDto> result = activityService.findByContactId(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).contactName()).isEqualTo("Alice Smith");
    }

    @Test
    void findByDealId_returnsListFromRepository() {
        when(activityRepository.findByDealIdOrderByOccurredAtDesc(1L)).thenReturn(List.of(testActivity));

        List<ActivityDto> result = activityService.findByDealId(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).dealTitle()).isEqualTo("Big Deal");
    }

    @Test
    void create_withAllFields_savesActivity() {
        CreateActivityRequest req = new CreateActivityRequest(
                "Discovery call", ActivityType.CALL, "Notes", Instant.now(), 1L, 1L, 1L);
        when(contactRepository.findById(1L)).thenReturn(Optional.of(testContact));
        when(dealRepository.findById(1L)).thenReturn(Optional.of(testDeal));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(activityRepository.save(any(Activity.class))).thenReturn(testActivity);

        ActivityDto result = activityService.create(req);

        assertThat(result.subject()).isEqualTo("Discovery call");
        assertThat(result.authorName()).isEqualTo("John Author");
    }

    @Test
    void create_withNullOptionalFields_savesWithoutRelations() {
        CreateActivityRequest req = new CreateActivityRequest(
                "Quick note", ActivityType.NOTE, null, null, null, null, null);
        Activity saved = new Activity();
        saved.setId(2L);
        saved.setType(ActivityType.NOTE);
        saved.setSubject("Quick note");
        saved.setOccurredAt(Instant.now());
        saved.setCreatedAt(Instant.now());
        when(activityRepository.save(any(Activity.class))).thenReturn(saved);

        ActivityDto result = activityService.create(req);

        assertThat(result.contactId()).isNull();
        assertThat(result.dealId()).isNull();
        assertThat(result.authorId()).isNull();
        verify(contactRepository, never()).findById(any());
    }

    @Test
    void delete_existingActivity_deletes() {
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));

        activityService.delete(1L);

        verify(activityRepository).delete(testActivity);
    }

    @Test
    void delete_notFound_throwsResourceNotFoundException() {
        when(activityRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> activityService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void activityDto_withNullContactDealAuthor_returnsNullFields() {
        Activity bare = new Activity();
        bare.setId(2L);
        bare.setType(ActivityType.EMAIL);
        bare.setSubject("Email");
        bare.setOccurredAt(Instant.now());
        bare.setCreatedAt(Instant.now());

        ActivityDto dto = ActivityDto.from(bare);

        assertThat(dto.contactId()).isNull();
        assertThat(dto.contactName()).isNull();
        assertThat(dto.dealId()).isNull();
        assertThat(dto.dealTitle()).isNull();
        assertThat(dto.authorId()).isNull();
        assertThat(dto.authorName()).isNull();
    }

    @Test
    void activity_setterGetterCoverage() {
        Instant now = Instant.now();
        Activity a = new Activity();
        a.setId(1L);
        a.setType(ActivityType.MEETING);
        a.setSubject("Meeting");
        a.setNotes("Notes");
        a.setOccurredAt(now);
        a.setContact(testContact);
        a.setDeal(testDeal);
        a.setAuthor(testUser);
        a.setCreatedAt(now);

        assertThat(a.getId()).isEqualTo(1L);
        assertThat(a.getType()).isEqualTo(ActivityType.MEETING);
        assertThat(a.getSubject()).isEqualTo("Meeting");
        assertThat(a.getNotes()).isEqualTo("Notes");
        assertThat(a.getOccurredAt()).isEqualTo(now);
        assertThat(a.getContact()).isEqualTo(testContact);
        assertThat(a.getDeal()).isEqualTo(testDeal);
        assertThat(a.getAuthor()).isEqualTo(testUser);
        assertThat(a.getCreatedAt()).isEqualTo(now);
    }

    @Test
    void create_withNullOccurredAt_savesSuccessfully() {
        CreateActivityRequest req = new CreateActivityRequest(
                "Test", ActivityType.NOTE, null, null, null, null, null);
        Activity saved = new Activity();
        saved.setId(3L);
        saved.setType(ActivityType.NOTE);
        saved.setSubject("Test");
        saved.setOccurredAt(Instant.now());
        saved.setCreatedAt(Instant.now());
        when(activityRepository.save(any(Activity.class))).thenReturn(saved);

        ActivityDto result = activityService.create(req);

        assertThat(result).isNotNull();
    }
}
