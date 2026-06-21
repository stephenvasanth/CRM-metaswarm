package com.crm.domain.activity;

import com.crm.domain.activity.dto.ActivityDto;
import com.crm.domain.activity.dto.CreateActivityRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @PostMapping("/api/activities")
    public ResponseEntity<ActivityDto> create(@Valid @RequestBody CreateActivityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(activityService.create(request));
    }

    @GetMapping("/api/activities")
    public ResponseEntity<Page<ActivityDto>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(activityService.findAll(page, size));
    }

    @DeleteMapping("/api/activities/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        activityService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/contacts/{contactId}/activities")
    public ResponseEntity<List<ActivityDto>> getByContact(@PathVariable Long contactId) {
        return ResponseEntity.ok(activityService.findByContactId(contactId));
    }

    @GetMapping("/api/deals/{dealId}/activities")
    public ResponseEntity<List<ActivityDto>> getByDeal(@PathVariable Long dealId) {
        return ResponseEntity.ok(activityService.findByDealId(dealId));
    }
}
