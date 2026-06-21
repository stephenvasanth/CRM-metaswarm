package com.crm.domain.user.dto;

import com.crm.domain.user.Role;
import com.crm.domain.user.User;

import java.time.Instant;

public record UserDto(
        Long id,
        String email,
        String firstName,
        String lastName,
        Role role,
        boolean active,
        Instant createdAt
) {
    public static UserDto from(User user) {
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt()
        );
    }
}
