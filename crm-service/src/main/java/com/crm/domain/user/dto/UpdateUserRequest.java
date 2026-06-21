package com.crm.domain.user.dto;

import com.crm.domain.user.Role;

public record UpdateUserRequest(
        Role role,
        Boolean active
) {
}
