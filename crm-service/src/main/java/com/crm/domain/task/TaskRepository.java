package com.crm.domain.task;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    long countByDueDateAndCompleted(LocalDate dueDate, boolean completed);

    List<Task> findByAssigneeIdOrderByDueDateAsc(Long assigneeId);

    List<Task> findByContactIdOrderByDueDateAsc(Long contactId);

    List<Task> findByDealIdOrderByDueDateAsc(Long dealId);

    Page<Task> findAllByOrderByDueDateAsc(Pageable pageable);

    Page<Task> findByCompletedOrderByDueDateAsc(boolean completed, Pageable pageable);
}
