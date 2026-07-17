package com.zidio.keystone.controller;

import com.zidio.keystone.dto.PageResponse;
import com.zidio.keystone.dto.PartDtos;
import com.zidio.keystone.dto.TimeLogDtos;
import com.zidio.keystone.dto.WorkOrderDtos;
import com.zidio.keystone.security.UserPrincipal;
import com.zidio.keystone.service.WorkOrderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/work-orders")
@RequiredArgsConstructor
@Tag(name = "Work Orders", description = "Creation, dispatch, lifecycle, parts and time")
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PageResponse<WorkOrderDtos.WorkOrderResponse>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Long technicianId,
            @RequestParam(required = false) Long siteId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {

        var result = workOrderService.list(status, priority, technicianId, siteId, customerId, search,
                principal, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(PageResponse.from(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WorkOrderDtos.WorkOrderDetailResponse> get(@PathVariable Long id,
                                                                      @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(workOrderService.getDetail(id, principal));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER','CUSTOMER')")
    public ResponseEntity<WorkOrderDtos.WorkOrderResponse> create(@Valid @RequestBody WorkOrderDtos.WorkOrderCreateRequest request,
                                                                   @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(201).body(workOrderService.create(request, principal));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public ResponseEntity<WorkOrderDtos.WorkOrderResponse> update(@PathVariable Long id,
                                                                   @Valid @RequestBody WorkOrderDtos.WorkOrderUpdateRequest request,
                                                                   @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(workOrderService.update(id, request, principal));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public ResponseEntity<WorkOrderDtos.WorkOrderResponse> assign(@PathVariable Long id,
                                                                   @Valid @RequestBody WorkOrderDtos.AssignRequest request,
                                                                   @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(workOrderService.assign(id, request, principal));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<WorkOrderDtos.WorkOrderResponse> changeStatus(@PathVariable Long id,
                                                                        @Valid @RequestBody WorkOrderDtos.StatusChangeRequest request,
                                                                        @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(workOrderService.changeStatus(id, request, principal));
    }

    @PostMapping("/{id}/parts")
    @PreAuthorize("hasAnyRole('TECHNICIAN','MANAGER')")
    public ResponseEntity<PartDtos.PartUsageResponse> logParts(@PathVariable Long id,
                                                                @Valid @RequestBody PartDtos.PartUsageRequest request,
                                                                @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(201).body(workOrderService.logParts(id, request, principal));
    }

    @PostMapping("/{id}/time")
    @PreAuthorize("hasAnyRole('TECHNICIAN','MANAGER')")
    public ResponseEntity<TimeLogDtos.TimeLogResponse> logTime(@PathVariable Long id,
                                                                @Valid @RequestBody TimeLogDtos.TimeLogRequest request,
                                                                @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(201).body(workOrderService.logTime(id, request, principal));
    }
}
