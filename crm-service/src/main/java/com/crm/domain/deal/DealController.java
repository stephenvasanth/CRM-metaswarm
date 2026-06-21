package com.crm.domain.deal;

import com.crm.domain.deal.dto.CreateDealRequest;
import com.crm.domain.deal.dto.DealDto;
import com.crm.domain.deal.dto.DealStatsDto;
import com.crm.domain.deal.dto.StageUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deals")
public class DealController {

    private final DealService dealService;

    public DealController(DealService dealService) {
        this.dealService = dealService;
    }

    @GetMapping
    public ResponseEntity<List<DealDto>> getAll() {
        return ResponseEntity.ok(dealService.findAll());
    }

    @GetMapping("/stats")
    public ResponseEntity<DealStatsDto> getStats() {
        return ResponseEntity.ok(dealService.getStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DealDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(dealService.findById(id));
    }

    @PostMapping
    public ResponseEntity<DealDto> create(@Valid @RequestBody CreateDealRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dealService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DealDto> update(
            @PathVariable Long id,
            @Valid @RequestBody CreateDealRequest request) {
        return ResponseEntity.ok(dealService.update(id, request));
    }

    @PatchMapping("/{id}/stage")
    public ResponseEntity<DealDto> updateStage(
            @PathVariable Long id,
            @Valid @RequestBody StageUpdateRequest request) {
        return ResponseEntity.ok(dealService.updateStage(id, request.stage()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        dealService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
