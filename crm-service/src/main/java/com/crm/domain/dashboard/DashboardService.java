package com.crm.domain.dashboard;

import com.crm.domain.activity.ActivityRepository;
import com.crm.domain.activity.dto.ActivityDto;
import com.crm.domain.contact.ContactRepository;
import com.crm.domain.deal.DealRepository;
import com.crm.domain.deal.DealStage;
import com.crm.domain.task.TaskRepository;
import com.crm.domain.task.dto.TaskDto;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    static final String CACHE_KEY = "dashboard:summary";
    private static final List<DealStage> OPEN_STAGES =
            Arrays.asList(DealStage.LEAD, DealStage.QUALIFIED, DealStage.PROPOSAL, DealStage.NEGOTIATION);
    private static final List<DealStage> CHART_STAGES =
            Arrays.asList(DealStage.LEAD, DealStage.QUALIFIED, DealStage.PROPOSAL,
                          DealStage.NEGOTIATION, DealStage.CLOSED_WON);

    private final DealRepository dealRepository;
    private final ContactRepository contactRepository;
    private final TaskRepository taskRepository;
    private final ActivityRepository activityRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public DashboardService(DealRepository dealRepository,
                            ContactRepository contactRepository,
                            TaskRepository taskRepository,
                            ActivityRepository activityRepository,
                            RedisTemplate<String, Object> redisTemplate) {
        this.dealRepository = dealRepository;
        this.contactRepository = contactRepository;
        this.taskRepository = taskRepository;
        this.activityRepository = activityRepository;
        this.redisTemplate = redisTemplate;
    }

    @SuppressWarnings("unchecked")
    public DashboardDto getDashboard() {
        Object cached = redisTemplate.opsForValue().get(CACHE_KEY);
        if (cached != null) {
            return (DashboardDto) cached;
        }

        List<Object[]> stageStats = dealRepository.getStatsByStage();

        long openDealsCount = 0L;
        BigDecimal pipelineValue = BigDecimal.ZERO;
        List<DashboardDto.DealStageStats> dealsByStage = new java.util.ArrayList<>();

        for (Object[] row : stageStats) {
            DealStage stage = (DealStage) row[0];
            long count = ((Number) row[1]).longValue();
            BigDecimal value = (BigDecimal) row[2];

            if (OPEN_STAGES.contains(stage)) {
                openDealsCount += count;
                pipelineValue = pipelineValue.add(value);
            }
            if (CHART_STAGES.contains(stage)) {
                dealsByStage.add(new DashboardDto.DealStageStats(stage.name(), count, value));
            }
        }

        long tasksDueToday = taskRepository.countByDueDateAndCompleted(LocalDate.now(), false);
        long newContactsLast7Days = contactRepository.countByCreatedAtAfter(
                Instant.now().minus(7, ChronoUnit.DAYS));

        List<ActivityDto> recentActivities = activityRepository
                .findAllByOrderByOccurredAtDesc(PageRequest.of(0, 10))
                .getContent()
                .stream()
                .map(ActivityDto::from)
                .toList();

        List<TaskDto> upcomingTasks = taskRepository
                .findByCompletedOrderByDueDateAsc(false, PageRequest.of(0, 5))
                .getContent()
                .stream()
                .map(TaskDto::from)
                .toList();

        DashboardDto dto = new DashboardDto(
                openDealsCount, pipelineValue, tasksDueToday, newContactsLast7Days,
                dealsByStage, recentActivities, upcomingTasks);

        redisTemplate.opsForValue().set(CACHE_KEY, dto, 5, TimeUnit.MINUTES);
        return dto;
    }

    public void invalidateCache() {
        redisTemplate.delete(CACHE_KEY);
    }
}
