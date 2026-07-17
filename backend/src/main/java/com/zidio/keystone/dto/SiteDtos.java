package com.zidio.keystone.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class SiteDtos {

    public record SiteRequest(
            @NotNull(message = "customerId is required") Long customerId,
            @NotBlank(message = "Name is required") String name,
            String address
    ) {}

    public record SiteResponse(
            Long id,
            Long customerId,
            String customerName,
            String name,
            String address,
            LocalDateTime createdAt
    ) {}
}
