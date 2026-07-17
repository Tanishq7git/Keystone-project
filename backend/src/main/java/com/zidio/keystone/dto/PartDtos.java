package com.zidio.keystone.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class PartDtos {

    public record PartRequest(
            @NotBlank String name,
            @NotBlank String sku,
            @NotNull @DecimalMin(value = "0.0") BigDecimal unitCost,
            @Min(0) Integer stockQty
    ) {}

    public record PartResponse(
            Long id,
            String name,
            String sku,
            BigDecimal unitCost,
            int stockQty
    ) {}

    public record PartUsageRequest(
            @NotNull Long partId,
            @NotNull @Min(1) Integer qtyUsed
    ) {}

    public record PartUsageResponse(
            Long id,
            Long partId,
            String partName,
            String sku,
            int qtyUsed,
            BigDecimal lineCost,
            String loggedByName,
            java.time.LocalDateTime usedAt
    ) {}
}
