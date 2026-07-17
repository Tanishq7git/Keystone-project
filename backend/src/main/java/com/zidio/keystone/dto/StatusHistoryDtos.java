package com.zidio.keystone.dto;

import java.time.LocalDateTime;

public class StatusHistoryDtos {

    public record StatusHistoryResponse(
            Long id,
            String fromStatus,
            String toStatus,
            String changedByName,
            LocalDateTime changedAt,
            String note
    ) {}
}
