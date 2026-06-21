package com.crm.domain.task;

import com.crm.domain.task.dto.CompleteTaskRequest;
import com.crm.domain.task.dto.CreateTaskRequest;
import com.crm.domain.task.dto.TaskDto;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/api/tasks")
    public ResponseEntity<Page<TaskDto>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean completed) {
        return ResponseEntity.ok(taskService.findAll(page, size, completed));
    }

    @PostMapping("/api/tasks")
    public ResponseEntity<TaskDto> create(@Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.create(request));
    }

    @PutMapping("/api/tasks/{id}")
    public ResponseEntity<TaskDto> update(
            @PathVariable Long id,
            @Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.ok(taskService.update(id, request));
    }

    @PatchMapping("/api/tasks/{id}/complete")
    public ResponseEntity<TaskDto> complete(
            @PathVariable Long id,
            @RequestBody CompleteTaskRequest request) {
        return ResponseEntity.ok(taskService.complete(id, request.completed()));
    }

    @DeleteMapping("/api/tasks/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        taskService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/contacts/{contactId}/tasks")
    public ResponseEntity<List<TaskDto>> getByContact(@PathVariable Long contactId) {
        return ResponseEntity.ok(taskService.findByContactId(contactId));
    }

    @GetMapping("/api/deals/{dealId}/tasks")
    public ResponseEntity<List<TaskDto>> getByDeal(@PathVariable Long dealId) {
        return ResponseEntity.ok(taskService.findByDealId(dealId));
    }
}
