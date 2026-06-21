package com.crm.domain.task;

import com.crm.domain.contact.ContactRepository;
import com.crm.domain.deal.DealRepository;
import com.crm.domain.task.dto.CreateTaskRequest;
import com.crm.domain.task.dto.TaskDto;
import com.crm.domain.user.UserRepository;
import com.crm.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final ContactRepository contactRepository;
    private final DealRepository dealRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository,
                       ContactRepository contactRepository,
                       DealRepository dealRepository,
                       UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.contactRepository = contactRepository;
        this.dealRepository = dealRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<TaskDto> findAll(int page, int size, Boolean completed) {
        if (completed != null) {
            return taskRepository
                    .findByCompletedOrderByDueDateAsc(completed, PageRequest.of(page, size))
                    .map(TaskDto::from);
        }
        return taskRepository
                .findAllByOrderByDueDateAsc(PageRequest.of(page, size))
                .map(TaskDto::from);
    }

    @Transactional(readOnly = true)
    public List<TaskDto> findByContactId(Long contactId) {
        return taskRepository
                .findByContactIdOrderByDueDateAsc(contactId)
                .stream().map(TaskDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<TaskDto> findByDealId(Long dealId) {
        return taskRepository
                .findByDealIdOrderByDueDateAsc(dealId)
                .stream().map(TaskDto::from).toList();
    }

    public TaskDto create(CreateTaskRequest request) {
        Task task = new Task();
        applyFields(task, request);
        return TaskDto.from(taskRepository.save(task));
    }

    public TaskDto update(Long id, CreateTaskRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id));
        applyFields(task, request);
        return TaskDto.from(taskRepository.save(task));
    }

    public TaskDto complete(Long id, boolean completed) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id));
        task.setCompleted(completed);
        return TaskDto.from(taskRepository.save(task));
    }

    public void delete(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id));
        taskRepository.delete(task);
    }

    private void applyFields(Task task, CreateTaskRequest request) {
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setDueDate(request.dueDate());
        task.setAssignee(request.assigneeId() != null
                ? userRepository.findById(request.assigneeId()).orElse(null) : null);
        task.setContact(request.contactId() != null
                ? contactRepository.findById(request.contactId()).orElse(null) : null);
        task.setDeal(request.dealId() != null
                ? dealRepository.findById(request.dealId()).orElse(null) : null);
    }
}
