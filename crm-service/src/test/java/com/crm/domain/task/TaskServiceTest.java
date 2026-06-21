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
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock private TaskRepository taskRepository;
    @Mock private ContactRepository contactRepository;
    @Mock private DealRepository dealRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private TaskService taskService;

    private Task testTask;
    private User testUser;
    private Contact testContact;
    private Deal testDeal;

    @BeforeEach
    void setUp() {
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
    void findAll_withNullCompleted_fetchesAll() {
        when(taskRepository.findAllByOrderByDueDateAsc(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(testTask)));

        Page<TaskDto> result = taskService.findAll(0, 20, null);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).title()).isEqualTo("Follow up call");
        verify(taskRepository).findAllByOrderByDueDateAsc(any(Pageable.class));
    }

    @Test
    void findAll_withCompletedFilter_fetchesFiltered() {
        when(taskRepository.findByCompletedOrderByDueDateAsc(eq(false), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(testTask)));

        Page<TaskDto> result = taskService.findAll(0, 20, false);

        assertThat(result.getContent()).hasSize(1);
        verify(taskRepository).findByCompletedOrderByDueDateAsc(eq(false), any(Pageable.class));
    }

    @Test
    void findByContactId_returnsListFromRepository() {
        when(taskRepository.findByContactIdOrderByDueDateAsc(1L)).thenReturn(List.of(testTask));

        List<TaskDto> result = taskService.findByContactId(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).contactName()).isEqualTo("Alice Smith");
    }

    @Test
    void findByDealId_returnsListFromRepository() {
        when(taskRepository.findByDealIdOrderByDueDateAsc(1L)).thenReturn(List.of(testTask));

        List<TaskDto> result = taskService.findByDealId(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).dealTitle()).isEqualTo("Big Deal");
    }

    @Test
    void create_withAllFields_savesTask() {
        CreateTaskRequest req = new CreateTaskRequest(
                "Follow up call", "Call Alice", LocalDate.now().plusDays(7), 1L, 1L, 1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(contactRepository.findById(1L)).thenReturn(Optional.of(testContact));
        when(dealRepository.findById(1L)).thenReturn(Optional.of(testDeal));
        when(taskRepository.save(any(Task.class))).thenReturn(testTask);

        TaskDto result = taskService.create(req);

        assertThat(result.title()).isEqualTo("Follow up call");
        assertThat(result.assigneeName()).isEqualTo("John Assignee");
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

        TaskDto result = taskService.create(req);

        assertThat(result.assigneeId()).isNull();
        assertThat(result.contactId()).isNull();
        assertThat(result.dealId()).isNull();
        verify(userRepository, never()).findById(any());
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

        TaskDto result = taskService.update(1L, req);

        assertThat(result.title()).isEqualTo("Updated task");
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

        TaskDto result = taskService.complete(1L, true);

        assertThat(result.completed()).isTrue();
    }

    @Test
    void complete_notFound_throwsResourceNotFoundException() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.complete(99L, true))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_existingTask_deletes() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(testTask));

        taskService.delete(1L);

        verify(taskRepository).delete(testTask);
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
