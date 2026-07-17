package com.zidio.keystone.service;

import com.zidio.keystone.domain.Part;
import com.zidio.keystone.domain.PartUsage;
import com.zidio.keystone.domain.User;
import com.zidio.keystone.domain.WorkOrder;
import com.zidio.keystone.dto.PartDtos;
import com.zidio.keystone.exception.DuplicateResourceException;
import com.zidio.keystone.exception.InsufficientStockException;
import com.zidio.keystone.exception.ResourceNotFoundException;
import com.zidio.keystone.repository.PartRepository;
import com.zidio.keystone.repository.PartUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PartService {

    private final PartRepository partRepository;
    private final PartUsageRepository partUsageRepository;

    @Transactional(readOnly = true)
    public List<PartDtos.PartResponse> list() {
        return partRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public PartDtos.PartResponse create(PartDtos.PartRequest request) {
        if (partRepository.existsBySkuIgnoreCase(request.sku())) {
            throw new DuplicateResourceException("A part with SKU " + request.sku() + " already exists.");
        }
        Part part = Part.builder()
                .name(request.name())
                .sku(request.sku())
                .unitCost(request.unitCost())
                .stockQty(request.stockQty() == null ? 0 : request.stockQty())
                .build();
        return toResponse(partRepository.save(part));
    }

    @Transactional
    public PartDtos.PartResponse update(Long id, PartDtos.PartRequest request) {
        Part part = findOrThrow(id);
        part.setName(request.name());
        part.setSku(request.sku());
        part.setUnitCost(request.unitCost());
        if (request.stockQty() != null) {
            part.setStockQty(request.stockQty());
        }
        return toResponse(partRepository.save(part));
    }

    /**
     * Logs parts used on a job and decrements stock in the SAME transaction.
     * If stock is insufficient the whole operation rolls back — no partial updates.
     */
    @Transactional
    public PartDtos.PartUsageResponse logUsage(WorkOrder workOrder, PartDtos.PartUsageRequest request, User loggedBy) {
        Part part = findOrThrow(request.partId());

        if (part.getStockQty() < request.qtyUsed()) {
            throw new InsufficientStockException(
                    "Not enough stock for " + part.getName() + " (have " + part.getStockQty() + ", need " + request.qtyUsed() + ").");
        }

        part.setStockQty(part.getStockQty() - request.qtyUsed());
        partRepository.save(part);

        PartUsage usage = PartUsage.builder()
                .workOrder(workOrder)
                .part(part)
                .qtyUsed(request.qtyUsed())
                .loggedBy(loggedBy)
                .build();
        usage = partUsageRepository.save(usage);

        return toUsageResponse(usage);
    }

    Part findOrThrow(Long id) {
        return partRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Part " + id + " not found."));
    }

    private PartDtos.PartResponse toResponse(Part p) {
        return new PartDtos.PartResponse(p.getId(), p.getName(), p.getSku(), p.getUnitCost(), p.getStockQty());
    }

    PartDtos.PartUsageResponse toUsageResponse(PartUsage u) {
        BigDecimal lineCost = u.getPart().getUnitCost().multiply(BigDecimal.valueOf(u.getQtyUsed()));
        return new PartDtos.PartUsageResponse(
                u.getId(), u.getPart().getId(), u.getPart().getName(), u.getPart().getSku(),
                u.getQtyUsed(), lineCost,
                u.getLoggedBy() != null ? u.getLoggedBy().getName() : null,
                u.getUsedAt());
    }
}
