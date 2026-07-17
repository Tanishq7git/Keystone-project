package com.zidio.keystone.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public class CustomerDtos {

    public record CustomerRequest(
            @NotBlank(message = "Name is required") String name,
            @Email(message = "Must be a valid email") String contactEmail,
            String phone
    ) {}

    public record CustomerResponse(
            Long id,
            String name,
            String contactEmail,
            String phone,
            LocalDateTime createdAt,
            long siteCount
    ) {}
}
