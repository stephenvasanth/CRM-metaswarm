package com.crm.domain.dashboard;

import com.crm.domain.activity.dto.ActivityDto;
import com.crm.domain.task.dto.TaskDto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardDto(
        long openDealsCount,
        BigDecimal pipelineValue,
        long tasksDueToday,
        long newContactsLast7Days,
        List<DealStageStats> dealsByStage,
        List<ActivityDto> recentActivities,
        List<TaskDto> upcomingTasks
) {
    public record DealStageStats(String stage, long count, BigDecimal totalValue) {}
}
