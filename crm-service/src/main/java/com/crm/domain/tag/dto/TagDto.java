package com.crm.domain.tag.dto;

import com.crm.domain.tag.Tag;

public record TagDto(Long id, String name, String colour, long contactCount) {

    public static TagDto from(Tag tag) {
        return new TagDto(tag.getId(), tag.getName(), tag.getColour(), 0L);
    }

    public static TagDto from(Tag tag, long contactCount) {
        return new TagDto(tag.getId(), tag.getName(), tag.getColour(), contactCount);
    }
}
