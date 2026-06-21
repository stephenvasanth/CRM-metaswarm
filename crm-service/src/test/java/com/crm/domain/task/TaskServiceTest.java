package com.crm.domain.task;

import com.crm.domain.contact.Contact;
import com.crm.domain.contact.ContactRepository;
import com.crm.domain.deal.Deal;
import com.crm.domain.deal.DealRepository;
import com.crm.domain.task.dto.CreateTaskRequest;
import com.crm.domain.task.dto.TaskDto;
import com.crm.domain.user.User;
import com.crm.domain.user.UserRepository;
import com.crm.exception.ResourceNotFoundException;
import com.crm.util.PageData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ContactRepository contactRepository;

    @Mock
    private DealRepository dealRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOps;

    @InjectMocks
    private TaskService taskService;

    private Task testTask;
    private User testUser;
    private Contact testContact;
    private Deal testDeal;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);

        testUser = new User();
        testUser.setId(1L);
        testUser.setFirstName("John");
        testUser.setLastName("Assignee");

        testContact = new Contact();
        testContact.setId(1L);
        testContact.setFirstName("Alice");
        testContact.setLastName("Smith");

        testDeal = new Deal();
        testDeal.setId(1L);
        testDeal.setTitle("Big Deal");

        testTask = new Task();
        testTask.setId(1L);
        testTask.setTitle("Follow up call");
        testTask.setDescription("Call Alice about proposal");
        testTask.setDueDate(LocalDate.now().plusDays(7));
        testTask.setCompleted(false);
        testTask.setAssignee(testUser);
        testTask.setContact(testContact);
        testTask.setDeal(testDeal);
        testTask.setCreatedAt(Instant.now());
        testTask.setUpdatedAt(Instant.now());
    }

    @Test
    void findAll_cacheHit_returnsFromRedis() {
        PageData<TaskDto> cachedData = new PageData<>(List.of(), 0L, 0, 20);
        when(valueOps.get("tasks:page:0:20:null")).thenReturn(cachedData);

        Page<TaskDto> result = taskService.findAll(0, 20, null);

        assertThat(result).isEmpty();
        verify(taskRepository, never()).findAllByOrderByDueDateAsc(any(Pageable.class));
    }

    @Test
    void findAll_cacheMiss_withNullCompleted_fetchesAll() {
        when(valueOps.get("tasks:page:0:20:null")).thenReturn(null);
        when(taskRepository.findAllByOrderByDueDateAsc(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(testTask)));

        Page<TaskDto> result = taskService.findAll(0, 20, null);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).title()).isEqualTo("Follow up call");
        verify(valueOps).set(eq("tasks:page:0:20:null"), any(), eq(24L), eq(TimeUnit.HOURS));
    }

    @Test
    void findAll_cacheMiss_withCompletedFilter_fetchesFiltered() {
        when(valueOps.get("tasks:page:0:20:false")).thenReturn(null);
        when(taskRepository.findByCompletedOrderByDueDateAsc(eq(false), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(testTask)));

        Page<TaskDto> result = taskService.findAll(0, 20, false);

        assertThat(result.getContent()).hasSize(1);
        verify(taskRepository).findByCompletedOrderByDueDateAsc(eq(false), any(Pageable.class));
        verify(valueOps).set(eq("tasks:page:0:20:false"), any(), eq(24L), eq(TimeUnit.HOURS));
    }

    @Test
    void findByContactId_cacheHit_returnsFromRedis() {
        List<TaskDto> cached = List.of();
        when(valueOps.get("tasks:contact:1")).thenReturn(cached);

        List<TaskDto> result = taskService.findByContactId(1L);

        assertThat(result).isEqualTo(cached);
        verify(taskRepository, never()).findByContactIdOrderByDueDateAsc(any());
    }

    @Test
    void findByContactId_cacheMiss_fetchesAndCaches() {
        when(valueOps.get("tasks:contact:1")).thenReturn(null);
        when(taskRepository.findByContactIdOrderByDueDateAsc(1L)).thenReturn(List.of(testTask));

        List<TaskDto> result = taskService.findByContactId(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).contactName()).isEqualTo("Alice Smith");
        verify(valueOps).set(eq("tasks:contact:1"), any(), eq(24L), eq(TimeUnit.HOURS));
    }

    @Test
    void findByDealId_cacheHit_returnsFromRedis() {
        List<TaskDto> cached = List.of();
        when(valueOps.get("tasks:deal:1")).thenReturn(cached);

        List<TaskDto> result = taskService.findByDealId(1L);

        assertThat(result).isEqualTo(cached);
        verify(taskRepository, never()).findByDealIdOrderByDueDateAsc(any());
    }

    @Test
    void findByDealId_cacheMiss_fetchesAndCaches() {
        when(valueOps.get("tasks:deal:1")).thenReturn(null);
        when(taskRepository.findByDealIdOrderByDueDateAsc(1L)).thenReturn(List.of(testTask));

        List<TaskDto> result = taskService.findByDealId(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).dealTitle()).isEqualTo("Big Deal");
        verify(valueOps).set(eq("tasks:deal:1"), any(), eq(24L), eq(TimeUnit.HOURS));
    }

    @Test
    void create_withAllFields_savesAndInvalidatesCache() {
        CreateTaskRequest req = new CreateTaskRequest(
                "Follow up call", "Call Alice", LocalDate.now().plusDays(7), 1L, 1L, 1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(contactRepository.findById(1L)).thenReturn(Optional.of(testContact));
        when(dealRepository.findById(1L)).thenReturn(Optional.of(testDeal));
        when(taskRepository.save(any(Task.class))).thenReturn(testTask);
        when(redisTemplate.keys("tasks:*")).thenReturn(Set.of("tasks:page:0:20:null"));

        TaskDto result = taskService.create(req);

        assertThat(result.title()).isEqualTo("Follow up call");
        assertThat(result.assigneeName()).isEqualTo("John Assignee");
        verify(redisTemplate).delete(anyCollection());
    }

    @Test
    void create_withNullOptionalFields_savesWithoutRelations() {
        CreateTaskRequest req = new CreateTaskRequest("Simple task", null, null, null, null, null);
        Task saved = new Task();
        saved.setId(2L);
        saved.setTitle("Simple task");
        saved.setCompleted(false);
        saved.setCreatedAt(Instant.now());
        saved.setUpdatedAt(Instant.now());
        when(taskRepository.save(any(Task.class))).thenReturn(saved);
        when(redisTemplate.keys("tasks:*")).thenReturn(Set.of("tasks:page:0:20:null"));

        TaskDto result = taskService.create(req);

        assertThat(result.assigneeId()).isNull();
        assertThat(result.contactId()).isNull();
        assertThat(result.dealId()).isNull();
        verify(userRepository, never()).findById(any());
    }

    @Test
    void create_cacheKeysNull_doesNotCallDelete() {
        CreateTaskRequest req = new CreateTaskRequest("Task", null, null, null, null, null);
        Task saved = new Task();
        saved.setId(2L);
        saved.setTitle("Task");
        saved.setCompleted(false);
        saved.setCreatedAt(Instant.now());
        saved.setUpdatedAt(Instant.now());
        when(taskRepository.save(any(Task.class))).thenReturn(saved);
        when(redisTemplate.keys("tasks:*")).thenReturn(null);

        taskService.create(req);

        verify(redisTemplate, never()).delete(anyCollection());
    }

    @Test
    void create_cacheKeysEmpty_doesNotCallDelete() {
        CreateTaskRequest req = new CreateTaskRequest("Task", null, null, null, null, null);
        Task saved = new Task();
        saved.setId(2L);
        saved.setTitle("Task");
        saved.setCompleted(false);
        saved.setCreatedAt(Instant.now());
        saved.setUpdatedAt(Instant.now());
        when(taskRepository.save(any(Task.class))).thenReturn(saved);
        when(redisTemplate.keys("tasks:*")).thenReturn(Set.of());

        taskService.create(req);

        verify(redisTemplate, never()).delete(anyCollection());
    }

    @Test
    void update_existingTask_updatesAndReturns() {
        CreateTaskRequest req = new CreateTaskRequest("Updated task", null, null, null, null, null);
        when(taskRepository.findById(1L)).thenReturn(Optional.of(testTask));
        Task updated = new Task();
        updated.setId(1L);
        updated.setTitle("Updated task");
        updated.setCompleted(false);
        updated.setCreatedAt(Instant.now());
        updated.setUpdatedAt(Instant.now());
        when(taskRepository.save(any(Task.class))).thenReturn(updated);
        when(redisTemplate.keys("tasks:*")).thenReturn(Set.of("tasks:page:0:20:null"));

        TaskDto result = taskService.update(1L, req);

        assertThat(result.title()).isEqualTo("Updated task");
        verify(redisTemplate).delete(anyCollection());
    }

    @Test
    void update_notFound_throwsResourceNotFoundException() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.update(99L,
                new CreateTaskRequest("X", null, null, null, null, null)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void complete_setsCompletedAndReturns() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(testTask));
        testTask.setCompleted(true);
        when(taskRepository.save(any(Task.class))).thenReturn(testTask);
        when(redisTemplate.keys("tasks:*")).thenReturn(Set.of("tasks:page:0:20:null"));

        TaskDto result = taskService.complete(1L, true);

        assertThat(result.completed()).isTrue();
        verify(redisTemplate).delete(anyCollection());
    }

    @Test
    void complete_notFound_throwsResourceNotFoundException() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.complete(99L, true))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_existingTask_deletesAndInvalidatesCache() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(testTask));
        when(redisTemplate.keys("tasks:*")).thenReturn(Set.of("tasks:page:0:20:null"));

        taskService.delete(1L);

        verify(taskRepository).delete(testTask);
        verify(redisTemplate).delete(anyCollection());
    }

    @Test
    void delete_notFound_throwsResourceNotFoundException() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void taskDto_withNullRelations_returnsNullFields() {
        Task bare = new Task();
        bare.setId(2L);
        bare.setTitle("Bare task");
        bare.setCompleted(false);
        bare.setCreatedAt(Instant.now());
        bare.setUpdatedAt(Instant.now());

        TaskDto dto = TaskDto.from(bare);

        assertThat(dto.assigneeId()).isNull();
        assertThat(dto.assigneeName()).isNull();
        assertThat(dto.contactId()).isNull();
        assertThat(dto.contactName()).isNull();
        assertThat(dto.dealId()).isNull();
        assertThat(dto.dealTitle()).isNull();
    }

    @Test
    void task_setterGetterCoverage() {
        Instant now = Instant.now();
        LocalDate today = LocalDate.now();
        Task t = new Task();
        t.setId(1L);
        t.setTitle("Test task");
        t.setDescription("Description");
        t.setDueDate(today);
        t.setCompleted(true);
        t.setAssignee(testUser);
        t.setContact(testContact);
        t.setDeal(testDeal);
        t.setCreatedAt(now);
        t.setUpdatedAt(now);

        assertThat(t.getId()).isEqualTo(1L);
        assertThat(t.getTitle()).isEqualTo("Test task");
        assertThat(t.getDescription()).isEqualTo("Description");
        assertThat(t.getDueDate()).isEqualTo(today);
        assertThat(t.isCompleted()).isTrue();
        assertThat(t.getAssignee()).isEqualTo(testUser);
        assertThat(t.getContact()).isEqualTo(testContact);
        assertThat(t.getDeal()).isEqualTo(testDeal);
        assertThat(t.getCreatedAt()).isEqualTo(now);
        assertThat(t.getUpdatedAt()).isEqualTo(now);
    }
}
