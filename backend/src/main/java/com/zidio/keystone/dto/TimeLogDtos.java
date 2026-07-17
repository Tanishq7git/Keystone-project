package com.zidio.keystone.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class TimeLogDtos {

    public record TimeLogRequest(
            @NotNull @Min(1) Integer minutes,
            String note
    ) {}

    public record TimeLogResponse(
            Long id,
            int minutes,
            String note,
            String technicianName,
            LocalDateTime loggedAt
    ) {}
}
