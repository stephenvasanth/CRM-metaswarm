package com.crm.domain.deal;

import com.crm.domain.contact.Contact;
import com.crm.domain.contact.ContactRepository;
import com.crm.domain.deal.dto.CreateDealRequest;
import com.crm.domain.deal.dto.DealDto;
import com.crm.domain.deal.dto.DealStatsDto;
import com.crm.domain.user.User;
import com.crm.domain.user.UserRepository;
import com.crm.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DealServiceTest {

    @Mock
    private DealRepository dealRepository;

    @Mock
    private ContactRepository contactRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOps;

    @InjectMocks
    private DealService dealService;

    private Deal testDeal;
    private User testUser;
    private Contact testContact;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);

        testUser = new User();
        testUser.setId(1L);
        testUser.setFirstName("John");
        testUser.setLastName("Owner");
        testUser.setEmail("owner@example.com");

        testContact = new Contact();
        testContact.setId(1L);
        testContact.setFirstName("Alice");
        testContact.setLastName("Smith");

        testDeal = new Deal();
        testDeal.setId(1L);
        testDeal.setTitle("Big Deal");
        testDeal.setValue(new BigDecimal("5000.00"));
        testDeal.setStage(DealStage.LEAD);
        testDeal.setExpectedClose(LocalDate.now().plusDays(30));
        testDeal.setContact(testContact);
        testDeal.setOwner(testUser);
        testDeal.setNotes("Important deal");
        testDeal.setCreatedAt(Instant.now());
        testDeal.setUpdatedAt(Instant.now());
    }

    @Test
    void findAll_cacheHit_returnsFromRedis() {
        List<DealDto> cached = List.of();
        when(valueOps.get("deals:all")).thenReturn(cached);

        List<DealDto> result = dealService.findAll();

        assertThat(result).isEqualTo(cached);
        verify(dealRepository, never()).findAll();
    }

    @Test
    void findAll_cacheMiss_fetchesAndCaches() {
        when(valueOps.get("deals:all")).thenReturn(null);
        when(dealRepository.findAll()).thenReturn(List.of(testDeal));

        List<DealDto> result = dealService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).title()).isEqualTo("Big Deal");
        verify(valueOps).set(eq("deals:all"), any(), eq(24L), eq(TimeUnit.HOURS));
    }

    @Test
    void findById_cacheHit_returnsFromRedis() {
        DealDto cached = new DealDto(1L, "Big Deal", new BigDecimal("5000.00"), DealStage.LEAD,
                null, 1L, "Alice Smith", 1L, "John Owner", "Notes",
                Instant.now(), Instant.now());
        when(valueOps.get("deals:id:1")).thenReturn(cached);

        DealDto result = dealService.findById(1L);

        assertThat(result).isEqualTo(cached);
        verify(dealRepository, never()).findById(any());
    }

    @Test
    void findById_cacheMiss_fetchesAndCaches() {
        when(valueOps.get("deals:id:1")).thenReturn(null);
        when(dealRepository.findById(1L)).thenReturn(Optional.of(testDeal));

        DealDto result = dealService.findById(1L);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.title()).isEqualTo("Big Deal");
        assertThat(result.contactId()).isEqualTo(1L);
        assertThat(result.ownerId()).isEqualTo(1L);
        verify(valueOps).set(eq("deals:id:1"), any(), eq(24L), eq(TimeUnit.HOURS));
    }

    @Test
    void findById_notFound_throwsResourceNotFoundException() {
        when(valueOps.get("deals:id:99")).thenReturn(null);
        when(dealRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dealService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_withoutOptionals_savesDeal() {
        CreateDealRequest req = new CreateDealRequest(
                "New Deal", new BigDecimal("1000"), DealStage.LEAD, null, null, null, null);
        Deal saved = new Deal();
        saved.setId(2L);
        saved.setTitle("New Deal");
        saved.setValue(new BigDecimal("1000"));
        saved.setStage(DealStage.LEAD);
        saved.setCreatedAt(Instant.now());
        saved.setUpdatedAt(Instant.now());
        when(dealRepository.save(any(Deal.class))).thenReturn(saved);
        when(redisTemplate.keys("deals:*")).thenReturn(Set.of("deals:all"));

        DealDto result = dealService.create(req);

        assertThat(result.title()).isEqualTo("New Deal");
        verify(redisTemplate).delete(anyCollection());
    }

    @Test
    void create_withContactAndOwner_setsRelations() {
        CreateDealRequest req = new CreateDealRequest(
                "Big Deal", new BigDecimal("5000"), DealStage.QUALIFIED, LocalDate.now(), 1L, 1L, "Notes");
        when(contactRepository.findById(1L)).thenReturn(Optional.of(testContact));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(dealRepository.save(any(Deal.class))).thenReturn(testDeal);
        when(redisTemplate.keys("deals:*")).thenReturn(Set.of("deals:all"));

        DealDto result = dealService.create(req);

        assertThat(result.contactId()).isEqualTo(1L);
        assertThat(result.ownerId()).isEqualTo(1L);
        verify(contactRepository).findById(1L);
        verify(userRepository).findById(1L);
    }

    @Test
    void update_existingDeal_updatesFields() {
        CreateDealRequest req = new CreateDealRequest(
                "Updated Deal", new BigDecimal("9999"), DealStage.PROPOSAL, null, null, null, null);
        when(dealRepository.findById(1L)).thenReturn(Optional.of(testDeal));
        Deal updated = new Deal();
        updated.setId(1L);
        updated.setTitle("Updated Deal");
        updated.setValue(new BigDecimal("9999"));
        updated.setStage(DealStage.PROPOSAL);
        updated.setCreatedAt(Instant.now());
        updated.setUpdatedAt(Instant.now());
        when(dealRepository.save(any(Deal.class))).thenReturn(updated);
        when(redisTemplate.keys("deals:*")).thenReturn(Set.of("deals:all"));

        DealDto result = dealService.update(1L, req);

        assertThat(result.title()).isEqualTo("Updated Deal");
        verify(redisTemplate).delete(anyCollection());
    }

    @Test
    void update_notFound_throwsResourceNotFoundException() {
        when(dealRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dealService.update(99L,
                new CreateDealRequest("X", BigDecimal.ZERO, DealStage.LEAD, null, null, null, null)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateStage_updatesAndReturnsDto() {
        when(dealRepository.findById(1L)).thenReturn(Optional.of(testDeal));
        when(dealRepository.save(any(Deal.class))).thenReturn(testDeal);
        when(redisTemplate.keys("deals:*")).thenReturn(Set.of("deals:all"));

        DealDto result = dealService.updateStage(1L, DealStage.QUALIFIED);

        assertThat(result).isNotNull();
        verify(redisTemplate).delete(anyCollection());
    }

    @Test
    void updateStage_notFound_throwsResourceNotFoundException() {
        when(dealRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dealService.updateStage(99L, DealStage.QUALIFIED))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_existingDeal_deletesAndInvalidates() {
        when(dealRepository.findById(1L)).thenReturn(Optional.of(testDeal));
        when(redisTemplate.keys("deals:*")).thenReturn(Set.of("deals:all"));

        dealService.delete(1L);

        verify(dealRepository).delete(testDeal);
        verify(redisTemplate).delete(anyCollection());
    }

    @Test
    void delete_notFound_throwsResourceNotFoundException() {
        when(dealRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dealService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getStats_cacheHit_returnsFromRedis() {
        DealStatsDto cached = new DealStatsDto(List.of());
        when(valueOps.get("deals:stats")).thenReturn(cached);

        DealStatsDto result = dealService.getStats();

        assertThat(result).isEqualTo(cached);
        verify(dealRepository, never()).getStatsByStage();
    }

    @Test
    void getStats_cacheMiss_buildsAllSixStages() {
        when(valueOps.get("deals:stats")).thenReturn(null);
        // Return stats for LEAD only — other stages should default to 0
        List<Object[]> rawStats = new ArrayList<>();
        rawStats.add(new Object[]{DealStage.LEAD, 3L, new BigDecimal("15000")});
        when(dealRepository.getStatsByStage()).thenReturn(rawStats);

        DealStatsDto result = dealService.getStats();

        // All 6 stages must be present
        assertThat(result.stages()).hasSize(6);
        // LEAD has data
        DealStatsDto.StageStats leadStats = result.stages().stream()
                .filter(s -> s.stage() == DealStage.LEAD)
                .findFirst().orElseThrow();
        assertThat(leadStats.count()).isEqualTo(3L);
        assertThat(leadStats.totalValue()).isEqualByComparingTo(new BigDecimal("15000"));
        // QUALIFIED has defaults
        DealStatsDto.StageStats qualStats = result.stages().stream()
                .filter(s -> s.stage() == DealStage.QUALIFIED)
                .findFirst().orElseThrow();
        assertThat(qualStats.count()).isEqualTo(0L);
        assertThat(qualStats.totalValue()).isEqualByComparingTo(BigDecimal.ZERO);
        verify(valueOps).set(eq("deals:stats"), any(), eq(24L), eq(TimeUnit.HOURS));
    }

    @Test
    void deal_setterGetterCoverage() {
        Instant now = Instant.now();
        Deal d = new Deal();
        d.setId(1L);
        d.setTitle("Test Deal");
        d.setValue(BigDecimal.TEN);
        d.setStage(DealStage.LEAD);
        d.setExpectedClose(LocalDate.now());
        d.setContact(testContact);
        d.setOwner(testUser);
        d.setNotes("Note");
        d.setCreatedAt(now);
        d.setUpdatedAt(now);
        assertThat(d.getId()).isEqualTo(1L);
        assertThat(d.getTitle()).isEqualTo("Test Deal");
        assertThat(d.getValue()).isEqualTo(BigDecimal.TEN);
        assertThat(d.getStage()).isEqualTo(DealStage.LEAD);
        assertThat(d.getExpectedClose()).isEqualTo(LocalDate.now());
        assertThat(d.getContact()).isEqualTo(testContact);
        assertThat(d.getOwner()).isEqualTo(testUser);
        assertThat(d.getNotes()).isEqualTo("Note");
        assertThat(d.getCreatedAt()).isEqualTo(now);
        assertThat(d.getUpdatedAt()).isEqualTo(now);
    }

    @Test
    void findById_dealWithNullContactAndOwner_returnsDto() {
        Deal bare = new Deal();
        bare.setId(2L);
        bare.setTitle("Bare Deal");
        bare.setStage(DealStage.LEAD);
        bare.setValue(BigDecimal.ZERO);
        bare.setCreatedAt(Instant.now());
        bare.setUpdatedAt(Instant.now());
        when(valueOps.get("deals:id:2")).thenReturn(null);
        when(dealRepository.findById(2L)).thenReturn(Optional.of(bare));

        DealDto result = dealService.findById(2L);

        assertThat(result.contactId()).isNull();
        assertThat(result.contactName()).isNull();
        assertThat(result.ownerId()).isNull();
        assertThat(result.ownerName()).isNull();
    }

    @Test
    void create_withNullValueAndNullStage_usesDefaults() {
        CreateDealRequest req = new CreateDealRequest(
                "Default Deal", null, null, null, null, null, null);
        Deal saved = new Deal();
        saved.setId(3L);
        saved.setTitle("Default Deal");
        saved.setValue(BigDecimal.ZERO);
        saved.setStage(DealStage.LEAD);
        saved.setCreatedAt(Instant.now());
        saved.setUpdatedAt(Instant.now());
        when(dealRepository.save(any(Deal.class))).thenReturn(saved);
        when(redisTemplate.keys("deals:*")).thenReturn(Set.of("deals:all"));

        DealDto result = dealService.create(req);

        assertThat(result.title()).isEqualTo("Default Deal");
    }

    @Test
    void getStats_withNonBigDecimalTotalValue_convertsToString() {
        when(valueOps.get("deals:stats")).thenReturn(null);
        // Simulate a database returning a Long instead of BigDecimal for total value
        List<Object[]> rawStats = new ArrayList<>();
        rawStats.add(new Object[]{DealStage.PROPOSAL, 2L, 5000L});
        when(dealRepository.getStatsByStage()).thenReturn(rawStats);

        DealStatsDto result = dealService.getStats();

        DealStatsDto.StageStats proposalStats = result.stages().stream()
                .filter(s -> s.stage() == DealStage.PROPOSAL)
                .findFirst().orElseThrow();
        assertThat(proposalStats.count()).isEqualTo(2L);
        assertThat(proposalStats.totalValue()).isEqualByComparingTo(new BigDecimal("5000"));
    }

    @Test
    void create_cacheKeysNull_doesNotCallDelete() {
        CreateDealRequest req = new CreateDealRequest(
                "New Deal", BigDecimal.ZERO, DealStage.LEAD, null, null, null, null);
        Deal saved = new Deal();
        saved.setId(2L);
        saved.setTitle("New Deal");
        saved.setValue(BigDecimal.ZERO);
        saved.setStage(DealStage.LEAD);
        saved.setCreatedAt(Instant.now());
        saved.setUpdatedAt(Instant.now());
        when(dealRepository.save(any(Deal.class))).thenReturn(saved);
        when(redisTemplate.keys("deals:*")).thenReturn(null);

        dealService.create(req);

        verify(redisTemplate, never()).delete(anyCollection());
    }

    @Test
    void create_cacheKeysEmpty_doesNotCallDelete() {
        CreateDealRequest req = new CreateDealRequest(
                "New Deal", BigDecimal.ZERO, DealStage.LEAD, null, null, null, null);
        Deal saved = new Deal();
        saved.setId(2L);
        saved.setTitle("New Deal");
        saved.setValue(BigDecimal.ZERO);
        saved.setStage(DealStage.LEAD);
        saved.setCreatedAt(Instant.now());
        saved.setUpdatedAt(Instant.now());
        when(dealRepository.save(any(Deal.class))).thenReturn(saved);
        when(redisTemplate.keys("deals:*")).thenReturn(Set.of());

        dealService.create(req);

        verify(redisTemplate, never()).delete(anyCollection());
    }
}
