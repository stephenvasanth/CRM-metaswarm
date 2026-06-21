package com.crm.domain.dashboard;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/api/dashboard")
    public ResponseEntity<DashboardDto> getDashboard() {
        return ResponseEntity.ok(dashboardService.getDashboard());
    }
}
