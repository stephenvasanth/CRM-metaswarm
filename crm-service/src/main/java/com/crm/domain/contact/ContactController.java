package com.crm.domain.contact;

import com.crm.domain.contact.dto.ContactDto;
import com.crm.domain.contact.dto.CreateContactRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @GetMapping
    public ResponseEntity<Page<ContactDto>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long tagId) {
        return ResponseEntity.ok(contactService.findAll(page, size, search, tagId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContactDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(contactService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ContactDto> create(@Valid @RequestBody CreateContactRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contactService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContactDto> update(
            @PathVariable Long id,
            @Valid @RequestBody CreateContactRequest request) {
        return ResponseEntity.ok(contactService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        contactService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
