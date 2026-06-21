package com.crm.domain.tag.dto;

import com.crm.domain.tag.Tag;

public record TagDto(Long id, String name, String colour) {

    public static TagDto from(Tag tag) {
        return new TagDto(tag.getId(), tag.getName(), tag.getColour());
    }
}
