package com.crm.domain.contact;

import com.crm.domain.company.CompanyRepository;
import com.crm.domain.contact.dto.ContactDto;
import com.crm.domain.contact.dto.CreateContactRequest;
import com.crm.domain.tag.Tag;
import com.crm.domain.tag.TagRepository;
import com.crm.domain.user.UserRepository;
import com.crm.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@Transactional
public class ContactService {

    private final ContactRepository contactRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public ContactService(ContactRepository contactRepository,
                          CompanyRepository companyRepository,
                          UserRepository userRepository,
                          TagRepository tagRepository,
                          RedisTemplate<String, Object> redisTemplate) {
        this.contactRepository = contactRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.tagRepository = tagRepository;
        this.redisTemplate = redisTemplate;
    }

    @Transactional(readOnly = true)
    public Page<ContactDto> findAll(int page, int size, String search, Long tagId) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<Contact> contactPage;
        if (tagId != null) {
            contactPage = contactRepository.findByTagId(tagId, pageable);
        } else if (search != null && !search.isBlank()) {
            contactPage = contactRepository.searchContacts(search, pageable);
        } else {
            contactPage = contactRepository.findAll(pageable);
        }
        return contactPage.map(ContactDto::from);
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public ContactDto findById(Long id) {
        String cacheKey = "contacts:id:" + id;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return (ContactDto) cached;
        }
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contact", id));
        ContactDto dto = ContactDto.from(contact);
        redisTemplate.opsForValue().set(cacheKey, dto, 24, TimeUnit.HOURS);
        return dto;
    }

    public ContactDto create(CreateContactRequest request) {
        Contact contact = new Contact();
        applyFields(contact, request);
        return ContactDto.from(contactRepository.save(contact));
    }

    public ContactDto update(Long id, CreateContactRequest request) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contact", id));
        applyFields(contact, request);
        Contact saved = contactRepository.save(contact);
        redisTemplate.delete("contacts:id:" + id);
        return ContactDto.from(saved);
    }

    public void delete(Long id) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contact", id));
        contactRepository.delete(contact);
        redisTemplate.delete("contacts:id:" + id);
    }

    private void applyFields(Contact contact, CreateContactRequest request) {
        contact.setFirstName(request.firstName());
        contact.setLastName(request.lastName());
        contact.setEmail(request.email());
        contact.setPhone(request.phone());
        contact.setJobTitle(request.jobTitle());

        if (request.companyId() != null) {
            contact.setCompany(companyRepository.findById(request.companyId()).orElse(null));
        } else {
            contact.setCompany(null);
        }

        if (request.ownerId() != null) {
            contact.setOwner(userRepository.findById(request.ownerId()).orElse(null));
        } else {
            contact.setOwner(null);
        }

        if (request.tagIds() != null && !request.tagIds().isEmpty()) {
            List<Tag> tags = tagRepository.findAllById(request.tagIds());
            contact.setTags(new HashSet<>(tags));
        } else {
            contact.setTags(new HashSet<>());
        }
    }

}
