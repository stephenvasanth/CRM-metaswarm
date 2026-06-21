package com.crm.domain.tag;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TagRepository extends JpaRepository<Tag, Long> {

    boolean existsByName(String name);

    @Modifying
    @Query(value = "DELETE FROM contact_tags WHERE tag_id = :tagId", nativeQuery = true)
    void deleteContactTagsByTagId(@Param("tagId") Long tagId);

    @Query(value = "SELECT tag_id, COUNT(*) FROM contact_tags GROUP BY tag_id", nativeQuery = true)
    List<Object[]> countContactsPerTag();
}
