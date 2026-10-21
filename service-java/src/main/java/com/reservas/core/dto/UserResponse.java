package com.reservas.core.dto;

import com.reservas.core.entity.User;

import java.time.OffsetDateTime;

public record UserResponse(Long id, String name, String username, String email, User.Role role,
                           OffsetDateTime createdAt) {

    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getName(), u.getUsername(), u.getEmail(), u.getRole(), u.getCreatedAt());
    }
}
