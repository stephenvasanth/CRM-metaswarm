package com.crm.domain.contact;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface ContactRepository extends JpaRepository<Contact, Long> {

    long countByCreatedAtAfter(Instant createdAt);

    @Query("SELECT c FROM Contact c WHERE " +
           "(:search IS NULL OR LOWER(c.firstName) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(c.lastName) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(c.email) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<Contact> searchContacts(@Param("search") String search, Pageable pageable);

    @Query("SELECT c FROM Contact c JOIN c.tags t WHERE t.id = :tagId")
    Page<Contact> findByTagId(@Param("tagId") Long tagId, Pageable pageable);
}
