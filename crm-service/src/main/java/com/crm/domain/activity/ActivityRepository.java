package com.crm.domain.activity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

    List<Activity> findByContactIdOrderByOccurredAtDesc(Long contactId);

    List<Activity> findByDealIdOrderByOccurredAtDesc(Long dealId);

    Page<Activity> findAllByOrderByOccurredAtDesc(Pageable pageable);
}
