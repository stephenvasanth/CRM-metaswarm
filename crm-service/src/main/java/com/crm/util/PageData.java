package com.crm.util;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

/**
 * Serializable page wrapper — PageImpl cannot be deserialized from Redis because it has
 * no default constructor. This record is trivially deserializable and converts to/from Page.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PageData<T>(List<T> content, long totalElements, int number, int size) {

    public static <T> PageData<T> of(Page<T> page) {
        return new PageData<>(page.getContent(), page.getTotalElements(), page.getNumber(), page.getSize());
    }

    public Page<T> toPage() {
        return new PageImpl<>(content, PageRequest.of(number, size), totalElements);
    }
}
