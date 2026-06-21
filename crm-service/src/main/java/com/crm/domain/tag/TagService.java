package com.crm.domain.tag;

import com.crm.domain.tag.dto.CreateTagRequest;
import com.crm.domain.tag.dto.TagDto;
import com.crm.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class TagService {

    private final TagRepository tagRepository;

    public TagService(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    @Transactional(readOnly = true)
    public List<TagDto> findAll() {
        List<Object[]> counts = tagRepository.countContactsPerTag();
        Map<Long, Long> countMap = counts.stream().collect(Collectors.toMap(
                row -> ((Number) row[0]).longValue(),
                row -> ((Number) row[1]).longValue()
        ));
        return tagRepository.findAll().stream()
                .map(tag -> TagDto.from(tag, countMap.getOrDefault(tag.getId(), 0L)))
                .toList();
    }

    public TagDto createTag(CreateTagRequest request) {
        if (tagRepository.existsByName(request.name())) {
            throw new IllegalArgumentException("A tag with this name already exists");
        }
        Tag tag = new Tag();
        tag.setName(request.name());
        tag.setColour(request.colour());
        return TagDto.from(tagRepository.save(tag));
    }

    public void deleteTag(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", id));
        tagRepository.deleteContactTagsByTagId(id);
        tagRepository.delete(tag);
    }
}
