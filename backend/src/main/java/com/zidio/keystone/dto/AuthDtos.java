package com.zidio.keystone.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AuthDtos {

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record LoginResponse(
            String token,
            Long userId,
            String name,
            String email,
            String role,
            Long customerId,
            long expiresInMs
    ) {}

    public record CurrentUserResponse(
            Long userId,
            String name,
            String email,
            String role,
            Long customerId,
            String customerName
    ) {}
}
