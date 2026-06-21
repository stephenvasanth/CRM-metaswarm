package com.crm.domain.task;

import com.crm.domain.contact.ContactRepository;
import com.crm.domain.deal.DealRepository;
import com.crm.domain.task.dto.CreateTaskRequest;
import com.crm.domain.task.dto.TaskDto;
import com.crm.domain.user.UserRepository;
import com.crm.exception.ResourceNotFoundException;
import com.crm.util.PageData;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final ContactRepository contactRepository;
    private final DealRepository dealRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public TaskService(TaskRepository taskRepository,
                       ContactRepository contactRepository,
                       DealRepository dealRepository,
                       UserRepository userRepository,
                       RedisTemplate<String, Object> redisTemplate) {
        this.taskRepository = taskRepository;
        this.contactRepository = contactRepository;
        this.dealRepository = dealRepository;
        this.userRepository = userRepository;
        this.redisTemplate = redisTemplate;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public Page<TaskDto> findAll(int page, int size, Boolean completed) {
        String cacheKey = "tasks:page:" + page + ":" + size + ":" + completed;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return ((PageData<TaskDto>) cached).toPage();
        }
        Page<TaskDto> result;
        if (completed != null) {
            result = taskRepository
                    .findByCompletedOrderByDueDateAsc(completed, PageRequest.of(page, size))
                    .map(TaskDto::from);
        } else {
            result = taskRepository
                    .findAllByOrderByDueDateAsc(PageRequest.of(page, size))
                    .map(TaskDto::from);
        }
        redisTemplate.opsForValue().set(cacheKey, PageData.of(result), 24, TimeUnit.HOURS);
        return result;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<TaskDto> findByContactId(Long contactId) {
        String cacheKey = "tasks:contact:" + contactId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return (List<TaskDto>) cached;
        }
        List<TaskDto> result = new ArrayList<>(taskRepository
                .findByContactIdOrderByDueDateAsc(contactId)
                .stream().map(TaskDto::from).toList());
        redisTemplate.opsForValue().set(cacheKey, result, 24, TimeUnit.HOURS);
        return result;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<TaskDto> findByDealId(Long dealId) {
        String cacheKey = "tasks:deal:" + dealId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return (List<TaskDto>) cached;
        }
        List<TaskDto> result = new ArrayList<>(taskRepository
                .findByDealIdOrderByDueDateAsc(dealId)
                .stream().map(TaskDto::from).toList());
        redisTemplate.opsForValue().set(cacheKey, result, 24, TimeUnit.HOURS);
        return result;
    }

    public TaskDto create(CreateTaskRequest request) {
        Task task = new Task();
        applyFields(task, request);
        Task saved = taskRepository.save(task);
        invalidateCache();
        return TaskDto.from(saved);
    }

    public TaskDto update(Long id, CreateTaskRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id));
        applyFields(task, request);
        Task saved = taskRepository.save(task);
        invalidateCache();
        return TaskDto.from(saved);
    }

    public TaskDto complete(Long id, boolean completed) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id));
        task.setCompleted(completed);
        Task saved = taskRepository.save(task);
        invalidateCache();
        return TaskDto.from(saved);
    }

    public void delete(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id));
        taskRepository.delete(task);
        invalidateCache();
    }

    private void applyFields(Task task, CreateTaskRequest request) {
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setDueDate(request.dueDate());
        if (request.assigneeId() != null) {
            task.setAssignee(userRepository.findById(request.assigneeId()).orElse(null));
        } else {
            task.setAssignee(null);
        }
        if (request.contactId() != null) {
            task.setContact(contactRepository.findById(request.contactId()).orElse(null));
        } else {
            task.setContact(null);
        }
        if (request.dealId() != null) {
            task.setDeal(dealRepository.findById(request.dealId()).orElse(null));
        } else {
            task.setDeal(null);
        }
    }

    private void invalidateCache() {
        Set<String> keys = redisTemplate.keys("tasks:*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
