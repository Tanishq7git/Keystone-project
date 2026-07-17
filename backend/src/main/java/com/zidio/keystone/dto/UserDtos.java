package com.zidio.keystone.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class UserDtos {

    public record UserCreateRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            @NotBlank String password,
            @NotNull String role,
            Long customerId
    ) {}

    public record UserResponse(
            Long id,
            String name,
            String email,
            String role,
            Long customerId,
            String customerName,
            boolean active,
            long openJobCount,
            LocalDateTime createdAt
    ) {}
}
