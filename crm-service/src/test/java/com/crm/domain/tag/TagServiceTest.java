package com.crm.domain.tag;

import com.crm.domain.tag.dto.CreateTagRequest;
import com.crm.domain.tag.dto.TagDto;
import com.crm.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TagServiceTest {

    @Mock private TagRepository tagRepository;

    @InjectMocks
    private TagService tagService;

    private Tag buildTag(Long id, String name, String colour) {
        Tag tag = new Tag();
        tag.setId(id);
        tag.setName(name);
        tag.setColour(colour);
        return tag;
    }

    @Test
    void findAll_fetchesFromDbWithContactCounts() {
        Tag tag = buildTag(1L, "VIP", "#6366F1");
        when(tagRepository.findAll()).thenReturn(List.of(tag));
        List<Object[]> counts = new ArrayList<>();
        counts.add(new Object[]{1L, 5L});
        when(tagRepository.countContactsPerTag()).thenReturn(counts);

        List<TagDto> result = tagService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("VIP");
        assertThat(result.get(0).contactCount()).isEqualTo(5L);
    }

    @Test
    void findAll_withNoCountData_defaultsToZero() {
        Tag tag = buildTag(1L, "VIP", "#6366F1");
        when(tagRepository.findAll()).thenReturn(List.of(tag));
        when(tagRepository.countContactsPerTag()).thenReturn(List.of());

        List<TagDto> result = tagService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).contactCount()).isEqualTo(0L);
    }

    @Test
    void createTag_success_saves() {
        CreateTagRequest req = new CreateTagRequest("Customer", "#FF5733");
        when(tagRepository.existsByName("Customer")).thenReturn(false);
        Tag saved = buildTag(1L, "Customer", "#FF5733");
        when(tagRepository.save(any(Tag.class))).thenReturn(saved);

        TagDto result = tagService.createTag(req);

        assertThat(result.name()).isEqualTo("Customer");
        assertThat(result.colour()).isEqualTo("#FF5733");
    }

    @Test
    void createTag_duplicateName_throwsIllegalArgumentException() {
        CreateTagRequest req = new CreateTagRequest("VIP", "#6366F1");
        when(tagRepository.existsByName("VIP")).thenReturn(true);

        assertThatThrownBy(() -> tagService.createTag(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("name");
    }

    @Test
    void deleteTag_success_deletesTag() {
        Tag tag = buildTag(1L, "VIP", "#6366F1");
        when(tagRepository.findById(1L)).thenReturn(Optional.of(tag));

        tagService.deleteTag(1L);

        verify(tagRepository).deleteContactTagsByTagId(1L);
        verify(tagRepository).delete(tag);
    }

    @Test
    void deleteTag_notFound_throwsResourceNotFoundException() {
        when(tagRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.deleteTag(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void tag_setterGetterCoverage() {
        java.time.Instant now = java.time.Instant.now();
        Tag t = new Tag();
        t.setId(1L);
        t.setName("Test");
        t.setColour("#123456");
        t.setCreatedAt(now);
        assertThat(t.getId()).isEqualTo(1L);
        assertThat(t.getName()).isEqualTo("Test");
        assertThat(t.getColour()).isEqualTo("#123456");
        assertThat(t.getCreatedAt()).isEqualTo(now);
    }
}
