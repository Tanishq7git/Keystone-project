package com.zidio.keystone.dto;

import java.time.LocalDateTime;

public class NotificationDtos {

    public record NotificationResponse(
            Long id,
            String message,
            Long workOrderId,
            String workOrderCode,
            boolean read,
            LocalDateTime createdAt
    ) {}
}
