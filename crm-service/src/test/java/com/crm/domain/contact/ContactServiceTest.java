package com.crm.domain.contact;

import com.crm.domain.company.Company;
import com.crm.domain.company.CompanyRepository;
import com.crm.domain.contact.dto.ContactDto;
import com.crm.domain.contact.dto.CreateContactRequest;
import com.crm.domain.tag.Tag;
import com.crm.domain.tag.TagRepository;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Instant;
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
class ContactServiceTest {

    @Mock private ContactRepository contactRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private UserRepository userRepository;
    @Mock private TagRepository tagRepository;
    @Mock private RedisTemplate<String, Object> redisTemplate;
    @Mock private ValueOperations<String, Object> valueOps;

    @InjectMocks
    private ContactService contactService;

    private Contact testContact;
    private User testUser;
    private Company testCompany;
    private Tag testTag;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);

        testUser = new User();
        testUser.setId(1L);
        testUser.setFirstName("John");
        testUser.setLastName("Owner");
        testUser.setEmail("owner@example.com");

        testCompany = new Company();
        testCompany.setId(1L);
        testCompany.setName("Acme Corp");

        testTag = new Tag();
        testTag.setId(1L);
        testTag.setName("VIP");
        testTag.setColour("#6366F1");

        testContact = new Contact();
        testContact.setId(1L);
        testContact.setFirstName("Alice");
        testContact.setLastName("Smith");
        testContact.setEmail("alice@example.com");
        testContact.setPhone("555-1234");
        testContact.setJobTitle("Engineer");
        testContact.setCompany(testCompany);
        testContact.setOwner(testUser);
        testContact.setTags(Set.of(testTag));
        testContact.setCreatedAt(Instant.now());
        testContact.setUpdatedAt(Instant.now());
    }

    // --- findAll (no cache) ---

    @Test
    void findAll_noFilter_fetchesAllFromDb() {
        Page<Contact> page = new PageImpl<>(List.of(testContact));
        when(contactRepository.findAll(any(Pageable.class))).thenReturn(page);

        Page<ContactDto> result = contactService.findAll(0, 20, null, null);

        assertThat(result).hasSize(1);
        assertThat(result.getContent().get(0).firstName()).isEqualTo("Alice");
        verify(contactRepository).findAll(any(Pageable.class));
        verify(valueOps, never()).set(anyString(), any(), anyLong(), any());
    }

    @Test
    void findAll_withSearch_usesSearchQuery() {
        Page<Contact> page = new PageImpl<>(List.of(testContact));
        when(contactRepository.searchContacts(eq("alice"), any(Pageable.class))).thenReturn(page);

        Page<ContactDto> result = contactService.findAll(0, 20, "alice", null);

        assertThat(result).hasSize(1);
        verify(contactRepository).searchContacts(eq("alice"), any(Pageable.class));
    }

    @Test
    void findAll_withTagId_usesTagQuery() {
        Page<Contact> page = new PageImpl<>(List.of(testContact));
        when(contactRepository.findByTagId(eq(1L), any(Pageable.class))).thenReturn(page);

        Page<ContactDto> result = contactService.findAll(0, 20, null, 1L);

        assertThat(result).hasSize(1);
        verify(contactRepository).findByTagId(eq(1L), any(Pageable.class));
    }

    // --- findById (cached) ---

    @Test
    void findById_cacheHit_returnsFromRedis() {
        ContactDto cached = new ContactDto(1L, "Alice", "Smith", "alice@example.com",
                "555-1234", "Engineer", 1L, "Acme Corp", 1L, "John Owner",
                List.of(), Instant.now(), Instant.now());
        when(valueOps.get("contacts:id:1")).thenReturn(cached);

        ContactDto result = contactService.findById(1L);

        assertThat(result).isEqualTo(cached);
        verify(contactRepository, never()).findById(any());
    }

    @Test
    void findById_cacheMiss_fetchesAndCaches() {
        when(valueOps.get("contacts:id:1")).thenReturn(null);
        when(contactRepository.findById(1L)).thenReturn(Optional.of(testContact));

        ContactDto result = contactService.findById(1L);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.firstName()).isEqualTo("Alice");
        assertThat(result.companyName()).isEqualTo("Acme Corp");
        assertThat(result.ownerName()).isEqualTo("John Owner");
        assertThat(result.tags()).hasSize(1);
        verify(valueOps).set(eq("contacts:id:1"), any(), eq(24L), eq(TimeUnit.HOURS));
    }

    @Test
    void findById_notFound_throwsResourceNotFoundException() {
        when(valueOps.get("contacts:id:99")).thenReturn(null);
        when(contactRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contactService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void findById_contactWithNullCompanyAndOwner_returnsDto() {
        Contact bare = new Contact();
        bare.setId(2L);
        bare.setFirstName("No");
        bare.setLastName("Owner");
        bare.setTags(Set.of());
        bare.setCreatedAt(Instant.now());
        bare.setUpdatedAt(Instant.now());
        when(valueOps.get("contacts:id:2")).thenReturn(null);
        when(contactRepository.findById(2L)).thenReturn(Optional.of(bare));

        ContactDto result = contactService.findById(2L);

        assertThat(result.companyId()).isNull();
        assertThat(result.ownerId()).isNull();
    }

    // --- create (no cache invalidation needed) ---

    @Test
    void create_withoutOptionalFields_savesContact() {
        CreateContactRequest req = new CreateContactRequest(
                "Bob", "Jones", "bob@example.com", null, null, null, null, null);
        Contact saved = new Contact();
        saved.setId(2L);
        saved.setFirstName("Bob");
        saved.setLastName("Jones");
        saved.setEmail("bob@example.com");
        saved.setTags(Set.of());
        saved.setCreatedAt(Instant.now());
        saved.setUpdatedAt(Instant.now());
        when(contactRepository.save(any(Contact.class))).thenReturn(saved);

        ContactDto result = contactService.create(req);

        assertThat(result.firstName()).isEqualTo("Bob");
        verify(redisTemplate, never()).delete(anyString());
    }

    @Test
    void create_withCompanyAndOwner_setsRelations() {
        CreateContactRequest req = new CreateContactRequest(
                "Alice", "Smith", "alice@example.com", "555-1234", "Engineer",
                1L, 1L, List.of(1L));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(tagRepository.findAllById(List.of(1L))).thenReturn(List.of(testTag));
        when(contactRepository.save(any(Contact.class))).thenReturn(testContact);

        ContactDto result = contactService.create(req);

        assertThat(result.companyId()).isEqualTo(1L);
        assertThat(result.ownerId()).isEqualTo(1L);
        assertThat(result.tags()).hasSize(1);
    }

    @Test
    void create_withEmptyTagIds_setsEmptyTags() {
        CreateContactRequest req = new CreateContactRequest(
                "Bob", "Jones", null, null, null, null, null, List.of());
        Contact saved = new Contact();
        saved.setId(2L);
        saved.setFirstName("Bob");
        saved.setLastName("Jones");
        saved.setTags(Set.of());
        saved.setCreatedAt(Instant.now());
        saved.setUpdatedAt(Instant.now());
        when(contactRepository.save(any(Contact.class))).thenReturn(saved);

        contactService.create(req);

        verify(tagRepository, never()).findAllById(any());
    }

    // --- update (evicts specific ID cache) ---

    @Test
    void update_existingContact_updatesAndEvictsIdCache() {
        CreateContactRequest req = new CreateContactRequest(
                "Updated", "Name", "updated@example.com", "999-0000", "Manager",
                null, null, null);
        when(contactRepository.findById(1L)).thenReturn(Optional.of(testContact));
        Contact updated = new Contact();
        updated.setId(1L);
        updated.setFirstName("Updated");
        updated.setLastName("Name");
        updated.setEmail("updated@example.com");
        updated.setTags(Set.of());
        updated.setCreatedAt(Instant.now());
        updated.setUpdatedAt(Instant.now());
        when(contactRepository.save(any(Contact.class))).thenReturn(updated);

        ContactDto result = contactService.update(1L, req);

        assertThat(result.firstName()).isEqualTo("Updated");
        verify(redisTemplate).delete("contacts:id:1");
    }

    @Test
    void update_notFound_throwsResourceNotFoundException() {
        when(contactRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contactService.update(99L,
                new CreateContactRequest("A", "B", null, null, null, null, null, null)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // --- delete (evicts specific ID cache) ---

    @Test
    void delete_existingContact_deletesAndEvictsIdCache() {
        when(contactRepository.findById(1L)).thenReturn(Optional.of(testContact));

        contactService.delete(1L);

        verify(contactRepository).delete(testContact);
        verify(redisTemplate).delete("contacts:id:1");
    }

    @Test
    void delete_notFound_throwsResourceNotFoundException() {
        when(contactRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contactService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // --- entity coverage ---

    @Test
    void contact_setterGetterCoverage() {
        Instant now = Instant.now();
        Contact c = new Contact();
        c.setId(1L);
        c.setFirstName("Alice");
        c.setLastName("Smith");
        c.setEmail("alice@example.com");
        c.setPhone("555-0000");
        c.setJobTitle("Dev");
        c.setCompany(testCompany);
        c.setOwner(testUser);
        c.setTags(Set.of());
        c.setCreatedAt(now);
        c.setUpdatedAt(now);
        assertThat(c.getId()).isEqualTo(1L);
        assertThat(c.getFirstName()).isEqualTo("Alice");
        assertThat(c.getLastName()).isEqualTo("Smith");
        assertThat(c.getEmail()).isEqualTo("alice@example.com");
        assertThat(c.getPhone()).isEqualTo("555-0000");
        assertThat(c.getJobTitle()).isEqualTo("Dev");
        assertThat(c.getCompany()).isEqualTo(testCompany);
        assertThat(c.getOwner()).isEqualTo(testUser);
        assertThat(c.getTags()).isEmpty();
        assertThat(c.getCreatedAt()).isEqualTo(now);
        assertThat(c.getUpdatedAt()).isEqualTo(now);
    }
}
