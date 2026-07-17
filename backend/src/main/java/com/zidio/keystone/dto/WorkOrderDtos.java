package com.zidio.keystone.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class WorkOrderDtos {

    public record WorkOrderCreateRequest(
            @NotBlank(message = "Title is required") String title,
            String description,
            @NotNull(message = "Priority is required") String priority,
            @NotNull(message = "customerId is required") Long customerId,
            @NotNull(message = "siteId is required") Long siteId
    ) {}

    public record WorkOrderUpdateRequest(
            @NotBlank String title,
            String description,
            @NotNull String priority
    ) {}

    public record AssignRequest(
            @NotNull(message = "technicianId is required") Long technicianId
    ) {}

    public record StatusChangeRequest(
            @NotBlank(message = "toStatus is required") String toStatus,
            String note
    ) {}

    /** Lightweight row for boards / lists. */
    public record WorkOrderResponse(
            Long id,
            String code,
            String title,
            String priority,
            String status,
            LocalDateTime slaDueAt,
            String slaStatus,
            Long customerId,
            String customerName,
            Long siteId,
            String siteName,
            Long assignedToId,
            String assignedToName,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {}

    /** Full detail view: work order + history + parts + time + rolled-up totals. */
    public record WorkOrderDetailResponse(
            Long id,
            String code,
            String title,
            String description,
            String priority,
            String status,
            LocalDateTime slaDueAt,
            String slaStatus,
            Long customerId,
            String customerName,
            Long siteId,
            String siteName,
            String siteAddress,
            Long assignedToId,
            String assignedToName,
            String createdByName,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            LocalDateTime completedAt,
            LocalDateTime closedAt,
            BigDecimal totalPartsCost,
            int totalMinutesLogged,
            List<StatusHistoryDtos.StatusHistoryResponse> history,
            List<PartDtos.PartUsageResponse> partsUsed,
            List<TimeLogDtos.TimeLogResponse> timeLogs
    ) {}
}
