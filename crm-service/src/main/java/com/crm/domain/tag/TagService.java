package com.crm.domain.tag;

import com.crm.domain.tag.dto.CreateTagRequest;
import com.crm.domain.tag.dto.TagDto;
import com.crm.exception.ResourceNotFoundException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@Transactional
public class TagService {

    private final TagRepository tagRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public TagService(TagRepository tagRepository,
                      RedisTemplate<String, Object> redisTemplate) {
        this.tagRepository = tagRepository;
        this.redisTemplate = redisTemplate;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<TagDto> findAll() {
        Object cached = redisTemplate.opsForValue().get("tags:all");
        if (cached != null) {
            return (List<TagDto>) cached;
        }
        List<TagDto> result = tagRepository.findAll().stream()
                .map(TagDto::from)
                .toList();
        redisTemplate.opsForValue().set("tags:all", result, 24, TimeUnit.HOURS);
        return result;
    }

    public TagDto createTag(CreateTagRequest request) {
        if (tagRepository.existsByName(request.name())) {
            throw new IllegalArgumentException("A tag with this name already exists");
        }
        Tag tag = new Tag();
        tag.setName(request.name());
        tag.setColour(request.colour());
        Tag saved = tagRepository.save(tag);
        redisTemplate.delete("tags:all");
        return TagDto.from(saved);
    }

    public void deleteTag(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", id));
        tagRepository.deleteContactTagsByTagId(id);
        tagRepository.delete(tag);
        redisTemplate.delete("tags:all");
    }
}
