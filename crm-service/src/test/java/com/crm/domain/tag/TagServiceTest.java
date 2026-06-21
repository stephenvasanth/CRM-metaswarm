package com.crm.domain.tag;

import com.crm.domain.tag.dto.CreateTagRequest;
import com.crm.domain.tag.dto.TagDto;
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

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TagServiceTest {

    @Mock
    private TagRepository tagRepository;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOps;

    @InjectMocks
    private TagService tagService;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    private Tag buildTag(Long id, String name, String colour) {
        Tag tag = new Tag();
        tag.setId(id);
        tag.setName(name);
        tag.setColour(colour);
        return tag;
    }

    @Test
    void findAll_cacheHit_returnsFromRedis() {
        List<TagDto> cached = List.of(new TagDto(1L, "VIP", "#6366F1"));
        when(valueOps.get("tags:all")).thenReturn(cached);

        List<TagDto> result = tagService.findAll();

        assertThat(result).isEqualTo(cached);
        verify(tagRepository, never()).findAll();
    }

    @Test
    void findAll_cacheMiss_fetchesFromDbAndCaches() {
        when(valueOps.get("tags:all")).thenReturn(null);
        Tag tag = buildTag(1L, "VIP", "#6366F1");
        when(tagRepository.findAll()).thenReturn(List.of(tag));

        List<TagDto> result = tagService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("VIP");
        verify(valueOps).set(eq("tags:all"), any(), eq(24L), eq(TimeUnit.HOURS));
    }

    @Test
    void createTag_success_savesAndInvalidatesCache() {
        CreateTagRequest req = new CreateTagRequest("Customer", "#FF5733");
        when(tagRepository.existsByName("Customer")).thenReturn(false);
        Tag saved = buildTag(1L, "Customer", "#FF5733");
        when(tagRepository.save(any(Tag.class))).thenReturn(saved);

        TagDto result = tagService.createTag(req);

        assertThat(result.name()).isEqualTo("Customer");
        assertThat(result.colour()).isEqualTo("#FF5733");
        verify(redisTemplate).delete("tags:all");
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
    void deleteTag_success_deletesAndInvalidatesCache() {
        Tag tag = buildTag(1L, "VIP", "#6366F1");
        when(tagRepository.findById(1L)).thenReturn(Optional.of(tag));

        tagService.deleteTag(1L);

        verify(tagRepository).deleteContactTagsByTagId(1L);
        verify(tagRepository).delete(tag);
        verify(redisTemplate).delete("tags:all");
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
