package com.crm.domain.dashboard;

import com.crm.domain.activity.Activity;
import com.crm.domain.activity.ActivityRepository;
import com.crm.domain.activity.ActivityType;
import com.crm.domain.contact.ContactRepository;
import com.crm.domain.deal.DealRepository;
import com.crm.domain.deal.DealStage;
import com.crm.domain.task.Task;
import com.crm.domain.task.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DashboardServiceTest {

    @Mock private DealRepository dealRepository;
    @Mock private ContactRepository contactRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private ActivityRepository activityRepository;
    @Mock private RedisTemplate<String, Object> redisTemplate;
    @Mock private ValueOperations<String, Object> valueOps;

    @InjectMocks private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    @Test
    void getDashboard_cacheHit_returnsCachedValue() {
        DashboardDto cached = new DashboardDto(5L, BigDecimal.valueOf(10000), 2L, 3L,
                List.of(), List.of(), List.of());
        when(valueOps.get(DashboardService.CACHE_KEY)).thenReturn(cached);

        DashboardDto result = dashboardService.getDashboard();

        assertThat(result).isSameAs(cached);
        verifyNoInteractions(dealRepository, contactRepository, taskRepository, activityRepository);
    }

    @Test
    void getDashboard_cacheMiss_computesAndCaches() {
        when(valueOps.get(DashboardService.CACHE_KEY)).thenReturn(null);

        List<Object[]> stageStats = new ArrayList<>();
        stageStats.add(new Object[]{DealStage.LEAD, 3L, BigDecimal.valueOf(5000)});
        stageStats.add(new Object[]{DealStage.QUALIFIED, 2L, BigDecimal.valueOf(8000)});
        stageStats.add(new Object[]{DealStage.CLOSED_WON, 1L, BigDecimal.valueOf(3000)});
        stageStats.add(new Object[]{DealStage.CLOSED_LOST, 1L, BigDecimal.valueOf(1000)});

        when(dealRepository.getStatsByStage()).thenReturn(stageStats);
        when(taskRepository.countByDueDateAndCompleted(any(LocalDate.class), eq(false))).thenReturn(4L);
        when(contactRepository.countByCreatedAtAfter(any(Instant.class))).thenReturn(7L);
        when(activityRepository.findAllByOrderByOccurredAtDesc(any()))
                .thenReturn(new PageImpl<>(List.of()));
        when(taskRepository.findByCompletedOrderByDueDateAsc(eq(false), any()))
                .thenReturn(new PageImpl<>(List.of()));

        DashboardDto result = dashboardService.getDashboard();

        assertThat(result.openDealsCount()).isEqualTo(5L);
        assertThat(result.pipelineValue()).isEqualByComparingTo(BigDecimal.valueOf(13000));
        assertThat(result.tasksDueToday()).isEqualTo(4L);
        assertThat(result.newContactsLast7Days()).isEqualTo(7L);
        assertThat(result.dealsByStage()).hasSize(3);
        verify(valueOps).set(eq(DashboardService.CACHE_KEY), any(DashboardDto.class), eq(5L), eq(TimeUnit.MINUTES));
    }

    @Test
    void getDashboard_closedLostExcludedFromOpenCount() {
        when(valueOps.get(DashboardService.CACHE_KEY)).thenReturn(null);

        List<Object[]> stageStats = new ArrayList<>();
        stageStats.add(new Object[]{DealStage.LEAD, 2L, BigDecimal.valueOf(2000)});
        stageStats.add(new Object[]{DealStage.CLOSED_LOST, 5L, BigDecimal.valueOf(9000)});

        when(dealRepository.getStatsByStage()).thenReturn(stageStats);
        when(taskRepository.countByDueDateAndCompleted(any(), anyBoolean())).thenReturn(0L);
        when(contactRepository.countByCreatedAtAfter(any())).thenReturn(0L);
        when(activityRepository.findAllByOrderByOccurredAtDesc(any())).thenReturn(new PageImpl<>(List.of()));
        when(taskRepository.findByCompletedOrderByDueDateAsc(anyBoolean(), any())).thenReturn(new PageImpl<>(List.of()));

        DashboardDto result = dashboardService.getDashboard();

        assertThat(result.openDealsCount()).isEqualTo(2L);
        assertThat(result.pipelineValue()).isEqualByComparingTo(BigDecimal.valueOf(2000));
        assertThat(result.dealsByStage()).hasSize(1);
        assertThat(result.dealsByStage().get(0).stage()).isEqualTo("LEAD");
    }

    @Test
    void getDashboard_emptyStageStats_returnsZeros() {
        when(valueOps.get(DashboardService.CACHE_KEY)).thenReturn(null);
        when(dealRepository.getStatsByStage()).thenReturn(List.of());
        when(taskRepository.countByDueDateAndCompleted(any(), anyBoolean())).thenReturn(0L);
        when(contactRepository.countByCreatedAtAfter(any())).thenReturn(0L);
        when(activityRepository.findAllByOrderByOccurredAtDesc(any())).thenReturn(new PageImpl<>(List.of()));
        when(taskRepository.findByCompletedOrderByDueDateAsc(anyBoolean(), any())).thenReturn(new PageImpl<>(List.of()));

        DashboardDto result = dashboardService.getDashboard();

        assertThat(result.openDealsCount()).isEqualTo(0L);
        assertThat(result.pipelineValue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.dealsByStage()).isEmpty();
    }

    @Test
    void getDashboard_includesRecentActivitiesAndUpcomingTasks() {
        when(valueOps.get(DashboardService.CACHE_KEY)).thenReturn(null);
        when(dealRepository.getStatsByStage()).thenReturn(List.of());
        when(taskRepository.countByDueDateAndCompleted(any(), anyBoolean())).thenReturn(0L);
        when(contactRepository.countByCreatedAtAfter(any())).thenReturn(0L);

        Activity activity = new Activity();
        activity.setId(1L);
        activity.setSubject("Call with Alice");
        activity.setType(ActivityType.CALL);
        activity.setOccurredAt(Instant.now());
        activity.setCreatedAt(Instant.now());

        Task task = new Task();
        task.setId(1L);
        task.setTitle("Follow up");
        task.setCompleted(false);
        task.setCreatedAt(Instant.now());
        task.setUpdatedAt(Instant.now());

        when(activityRepository.findAllByOrderByOccurredAtDesc(PageRequest.of(0, 10)))
                .thenReturn(new PageImpl<>(List.of(activity)));
        when(taskRepository.findByCompletedOrderByDueDateAsc(false, PageRequest.of(0, 5)))
                .thenReturn(new PageImpl<>(List.of(task)));

        DashboardDto result = dashboardService.getDashboard();

        assertThat(result.recentActivities()).hasSize(1);
        assertThat(result.recentActivities().get(0).subject()).isEqualTo("Call with Alice");
        assertThat(result.upcomingTasks()).hasSize(1);
        assertThat(result.upcomingTasks().get(0).title()).isEqualTo("Follow up");
    }

    @Test
    void getDashboard_closedWonIncludedInChartButNotOpenCount() {
        when(valueOps.get(DashboardService.CACHE_KEY)).thenReturn(null);

        List<Object[]> stageStats = new ArrayList<>();
        stageStats.add(new Object[]{DealStage.CLOSED_WON, 4L, BigDecimal.valueOf(6000)});

        when(dealRepository.getStatsByStage()).thenReturn(stageStats);
        when(taskRepository.countByDueDateAndCompleted(any(), anyBoolean())).thenReturn(0L);
        when(contactRepository.countByCreatedAtAfter(any())).thenReturn(0L);
        when(activityRepository.findAllByOrderByOccurredAtDesc(any())).thenReturn(new PageImpl<>(List.of()));
        when(taskRepository.findByCompletedOrderByDueDateAsc(anyBoolean(), any())).thenReturn(new PageImpl<>(List.of()));

        DashboardDto result = dashboardService.getDashboard();

        assertThat(result.openDealsCount()).isEqualTo(0L);
        assertThat(result.pipelineValue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.dealsByStage()).hasSize(1);
        assertThat(result.dealsByStage().get(0).stage()).isEqualTo("CLOSED_WON");
    }

    @Test
    void invalidateCache_deletesKey() {
        dashboardService.invalidateCache();
        verify(redisTemplate).delete(DashboardService.CACHE_KEY);
    }
}
