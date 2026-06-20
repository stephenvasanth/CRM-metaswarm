package com.crm.domain.auth.dto;

import com.crm.domain.user.dto.UserDto;

public record LoginResponse(
        String token,
        UserDto user
) {
}
