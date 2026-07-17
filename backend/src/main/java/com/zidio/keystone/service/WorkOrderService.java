package com.zidio.keystone.service;

import com.zidio.keystone.domain.*;
import com.zidio.keystone.dto.PartDtos;
import com.zidio.keystone.dto.StatusHistoryDtos;
import com.zidio.keystone.dto.TimeLogDtos;
import com.zidio.keystone.dto.WorkOrderDtos;
import com.zidio.keystone.exception.AccessForbiddenException;
import com.zidio.keystone.exception.IllegalWorkOrderTransitionException;
import com.zidio.keystone.exception.ResourceNotFoundException;
import com.zidio.keystone.repository.*;
import com.zidio.keystone.security.UserPrincipal;
import com.zidio.keystone.util.SlaCalculator;
import com.zidio.keystone.util.WorkOrderLifecycle;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

/**
 * Owns the work-order lifecycle: creation, dispatch/assignment, the guarded state
 * machine, and role-scoped reads. Every status change is written to the append-only
 * history table (Section 07). Authorisation is re-checked here regardless of what
 * the UI shows (Section 08) — assume a determined user calls the API directly.
 */
@Service
@RequiredArgsConstructor
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderStatusHistoryRepository historyRepository;
    private final CustomerRepository customerRepository;
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;
    private final PartUsageRepository partUsageRepository;
    private final TimeLogRepository timeLogRepository;
    private final PartService partService;
    private final TimeLogService timeLogService;
    private final NotificationService notificationService;

    @Value("${keystone.sla.urgent-hours}")
    private long urgentHours;
    @Value("${keystone.sla.high-hours}")
    private long highHours;
    @Value("${keystone.sla.medium-hours}")
    private long mediumHours;
    @Value("${keystone.sla.low-hours}")
    private long lowHours;

    private SlaCalculator slaCalculator() {
        return new SlaCalculator(urgentHours, highHours, mediumHours, lowHours);
    }

    // ==================== Create / Update ====================

    @Transactional
    public WorkOrderDtos.WorkOrderResponse create(WorkOrderDtos.WorkOrderCreateRequest request, UserPrincipal actingUser) {
        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer " + request.customerId() + " not found."));
        Site site = siteRepository.findById(request.siteId())
                .orElseThrow(() -> new ResourceNotFoundException("Site " + request.siteId() + " not found."));

        if (!site.getCustomer().getId().equals(customer.getId())) {
            throw new IllegalArgumentException("The selected site does not belong to the selected customer.");
        }

        Role role = Role.valueOf(actingUser.getRole());
        if (role == Role.CUSTOMER && !customer.getId().equals(actingUser.getCustomerId())) {
            throw new AccessForbiddenException("You may only raise requests for your own organisation.");
        }
        if (role == Role.TECHNICIAN) {
            throw new AccessForbiddenException("Technicians cannot raise new work orders.");
        }

        Priority priority = parsePriority(request.priority());
        User createdBy = userRepository.findById(actingUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        LocalDateTime now = LocalDateTime.now();
        WorkOrder wo = WorkOrder.builder()
                .code(generateCode())
                .title(request.title())
                .description(request.description())
                .priority(priority)
                .status(WorkOrderStatus.NEW)
                .slaDueAt(slaCalculator().dueFrom(now, priority))
                .slaBreached(false)
                .customer(customer)
                .site(site)
                .createdBy(createdBy)
                .build();
        wo = workOrderRepository.save(wo);

        writeHistory(wo, null, WorkOrderStatus.NEW, createdBy,
                role == Role.CUSTOMER ? "Submitted via customer portal." : "Work order raised.");

        return toResponse(wo);
    }

    @Transactional
    public WorkOrderDtos.WorkOrderResponse update(Long id, WorkOrderDtos.WorkOrderUpdateRequest request, UserPrincipal actingUser) {
        requireRole(actingUser, Role.DISPATCHER, Role.MANAGER);
        WorkOrder wo = findOrThrow(id);

        if (wo.getStatus().isTerminal()) {
            throw new IllegalWorkOrderTransitionException("Closed or cancelled work orders cannot be edited.");
        }

        wo.setTitle(request.title());
        wo.setDescription(request.description());
        wo.setPriority(parsePriority(request.priority()));
        wo.setSlaDueAt(slaCalculator().dueFrom(wo.getCreatedAt(), wo.getPriority()));
        wo = workOrderRepository.save(wo);
        return toResponse(wo);
    }

    // ==================== Dispatch ====================

    @Transactional
    public WorkOrderDtos.WorkOrderResponse assign(Long id, WorkOrderDtos.AssignRequest request, UserPrincipal actingUser) {
        requireRole(actingUser, Role.DISPATCHER, Role.MANAGER);
        WorkOrder wo = findOrThrow(id);

        if (wo.getStatus().isTerminal() || wo.getStatus() == WorkOrderStatus.COMPLETED) {
            throw new IllegalWorkOrderTransitionException("Cannot assign a " + wo.getStatus() + " work order.");
        }

        User technician = userRepository.findById(request.technicianId())
                .orElseThrow(() -> new ResourceNotFoundException("Technician " + request.technicianId() + " not found."));
        if (technician.getRole() != Role.TECHNICIAN) {
            throw new IllegalArgumentException("Work orders can only be assigned to a technician.");
        }

        User actor = userRepository.findById(actingUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        User previous = wo.getAssignedTo();
        wo.setAssignedTo(technician);

        if (wo.getStatus() == WorkOrderStatus.NEW) {
            WorkOrderStatus from = wo.getStatus();
            wo.setStatus(WorkOrderStatus.ASSIGNED);
            workOrderRepository.save(wo);
            writeHistory(wo, from, WorkOrderStatus.ASSIGNED, actor, "Assigned to " + technician.getName() + ".");
        } else {
            workOrderRepository.save(wo);
            String note = previous == null
                    ? "Assigned to " + technician.getName() + "."
                    : "Reassigned from " + previous.getName() + " to " + technician.getName() + ".";
            writeHistory(wo, wo.getStatus(), wo.getStatus(), actor, note);
        }

        notificationService.notifyAssignment(wo, technician);
        return toResponse(wo);
    }

    // ==================== Lifecycle ====================

    @Transactional
    public WorkOrderDtos.WorkOrderResponse changeStatus(Long id, WorkOrderDtos.StatusChangeRequest request, UserPrincipal actingUser) {
        WorkOrder wo = findOrThrow(id);
        WorkOrderStatus from = wo.getStatus();
        WorkOrderStatus to = parseStatus(request.toStatus());
        Role role = Role.valueOf(actingUser.getRole());

        if (!WorkOrderLifecycle.isAllowed(from, to)) {
            throw new IllegalWorkOrderTransitionException("Cannot move a work order from " + from + " to " + to + ".");
        }
        if (!WorkOrderLifecycle.roleCanPerform(from, to, role)) {
            throw new AccessForbiddenException("Your role cannot perform the " + from + " -> " + to + " transition.");
        }
        if (WorkOrderLifecycle.requiresAssignedTechnician(from, to, role)
                && (wo.getAssignedTo() == null || !wo.getAssignedTo().getId().equals(actingUser.getId()))) {
            throw new AccessForbiddenException("Only the technician this job is assigned to can do that.");
        }

        User actor = userRepository.findById(actingUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        wo.setStatus(to);
        if (to == WorkOrderStatus.COMPLETED) {
            wo.setCompletedAt(LocalDateTime.now());
        }
        if (to == WorkOrderStatus.CLOSED) {
            wo.setClosedAt(LocalDateTime.now());
        }
        if (to == WorkOrderStatus.IN_PROGRESS && from == WorkOrderStatus.COMPLETED) {
            wo.setCompletedAt(null); // reopened
        }
        workOrderRepository.save(wo);
        writeHistory(wo, from, to, actor, request.note());

        return toResponse(wo);
    }

    // ==================== Parts & time ====================

    @Transactional
    public PartDtos.PartUsageResponse logParts(Long id, PartDtos.PartUsageRequest request, UserPrincipal actingUser) {
        WorkOrder wo = findOrThrow(id);
        assertAssignedTechnicianOrManager(wo, actingUser);
        User actor = userRepository.findById(actingUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        return partService.logUsage(wo, request, actor);
    }

    @Transactional
    public TimeLogDtos.TimeLogResponse logTime(Long id, TimeLogDtos.TimeLogRequest request, UserPrincipal actingUser) {
        WorkOrder wo = findOrThrow(id);
        assertAssignedTechnicianOrManager(wo, actingUser);
        User actor = userRepository.findById(actingUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        return timeLogService.log(wo, request, actor);
    }

    private void assertAssignedTechnicianOrManager(WorkOrder wo, UserPrincipal actingUser) {
        Role role = Role.valueOf(actingUser.getRole());
        if (role == Role.MANAGER) return;
        if (role != Role.TECHNICIAN || wo.getAssignedTo() == null || !wo.getAssignedTo().getId().equals(actingUser.getId())) {
            throw new AccessForbiddenException("Only the assigned technician can log parts or time on this job.");
        }
    }

    // ==================== Reads ====================

    @Transactional(readOnly = true)
    public WorkOrderDtos.WorkOrderDetailResponse getDetail(Long id, UserPrincipal actingUser) {
        WorkOrder wo = findOrThrow(id);
        assertCanView(wo, actingUser);

        List<StatusHistoryDtos.StatusHistoryResponse> history = historyRepository
                .findByWorkOrderIdOrderByChangedAtAsc(id).stream().map(this::toHistoryResponse).toList();
        List<PartDtos.PartUsageResponse> parts = partUsageRepository
                .findByWorkOrderIdOrderByUsedAtAsc(id).stream().map(partService::toUsageResponse).toList();
        List<TimeLogDtos.TimeLogResponse> times = timeLogRepository
                .findByWorkOrderIdOrderByLoggedAtAsc(id).stream().map(timeLogService::toResponse).toList();

        BigDecimal totalParts = parts.stream()
                .map(PartDtos.PartUsageResponse::lineCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int totalMinutes = times.stream().mapToInt(TimeLogDtos.TimeLogResponse::minutes).sum();

        return new WorkOrderDtos.WorkOrderDetailResponse(
                wo.getId(), wo.getCode(), wo.getTitle(), wo.getDescription(),
                wo.getPriority().name(), wo.getStatus().name(), wo.getSlaDueAt(), slaStatus(wo),
                wo.getCustomer().getId(), wo.getCustomer().getName(),
                wo.getSite().getId(), wo.getSite().getName(), wo.getSite().getAddress(),
                wo.getAssignedTo() != null ? wo.getAssignedTo().getId() : null,
                wo.getAssignedTo() != null ? wo.getAssignedTo().getName() : null,
                wo.getCreatedBy() != null ? wo.getCreatedBy().getName() : null,
                wo.getCreatedAt(), wo.getUpdatedAt(), wo.getCompletedAt(), wo.getClosedAt(),
                totalParts, totalMinutes, history, parts, times);
    }

    @Transactional(readOnly = true)
    public Page<WorkOrderDtos.WorkOrderResponse> list(String status, String priority, Long technicianId,
                                                       Long siteId, Long customerId, String search,
                                                       UserPrincipal actingUser, Pageable pageable) {
        Specification<WorkOrder> spec = Specification.where(null);
        Role role = Role.valueOf(actingUser.getRole());

        if (role == Role.CUSTOMER) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("customer").get("id"), actingUser.getCustomerId()));
        } else if (role == Role.TECHNICIAN) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("assignedTo").get("id"), actingUser.getId()));
        }

        if (status != null && !status.isBlank()) {
            WorkOrderStatus s = parseStatus(status);
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), s));
        }
        if (priority != null && !priority.isBlank()) {
            Priority p = parsePriority(priority);
            spec = spec.and((root, q, cb) -> cb.equal(root.get("priority"), p));
        }
        if (technicianId != null && role != Role.TECHNICIAN) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("assignedTo").get("id"), technicianId));
        }
        if (siteId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("site").get("id"), siteId));
        }
        if (customerId != null && role != Role.CUSTOMER) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("customer").get("id"), customerId));
        }
        if (search != null && !search.isBlank()) {
            String like = "%" + search.toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("title")), like),
                    cb.like(cb.lower(root.get("code")), like)));
        }

        return workOrderRepository.findAll(spec, pageable).map(this::toResponse);
    }

    private void assertCanView(WorkOrder wo, UserPrincipal actingUser) {
        Role role = Role.valueOf(actingUser.getRole());
        if (role == Role.CUSTOMER && !wo.getCustomer().getId().equals(actingUser.getCustomerId())) {
            throw new AccessForbiddenException("You may only view your own organisation's work orders.");
        }
        if (role == Role.TECHNICIAN
                && (wo.getAssignedTo() == null || !wo.getAssignedTo().getId().equals(actingUser.getId()))) {
            throw new AccessForbiddenException("You may only view work orders assigned to you.");
        }
    }

    // ==================== Helpers ====================

    private void requireRole(UserPrincipal actingUser, Role... allowed) {
        Role role = Role.valueOf(actingUser.getRole());
        for (Role r : allowed) {
            if (r == role) return;
        }
        throw new AccessForbiddenException("Your role does not permit this action.");
    }

    WorkOrder findOrThrow(Long id) {
        return workOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Work order " + id + " not found."));
    }

    private String generateCode() {
        int year = LocalDateTime.now().getYear();
        String prefix = "WO-" + year + "-";
        long count = workOrderRepository.countByCodeStartingWith(prefix);
        return prefix + String.format("%05d", count + 1);
    }

    private void writeHistory(WorkOrder wo, WorkOrderStatus from, WorkOrderStatus to, User actor, String note) {
        WorkOrderStatusHistory h = WorkOrderStatusHistory.builder()
                .workOrder(wo).fromStatus(from).toStatus(to).changedBy(actor).note(note).build();
        historyRepository.save(h);
    }

    private Priority parsePriority(String value) {
        try {
            return Priority.valueOf(value.toUpperCase(Locale.ROOT));
        } catch (Exception e) {
            throw new IllegalArgumentException("Unknown priority: " + value);
        }
    }

    private WorkOrderStatus parseStatus(String value) {
        try {
            return WorkOrderStatus.valueOf(value.toUpperCase(Locale.ROOT));
        } catch (Exception e) {
            throw new IllegalArgumentException("Unknown status: " + value);
        }
    }

    /** ON_TRACK / AT_RISK / BREACHED / MET / NONE — computed for display, not stored (except the breached flag). */
    private String slaStatus(WorkOrder wo) {
        if (wo.getSlaDueAt() == null || wo.getStatus() == WorkOrderStatus.CANCELLED) {
            return "NONE";
        }
        if (wo.getStatus() == WorkOrderStatus.CLOSED || wo.getStatus() == WorkOrderStatus.COMPLETED) {
            LocalDateTime finishedAt = wo.getCompletedAt() != null ? wo.getCompletedAt() : wo.getClosedAt();
            if (finishedAt == null) return "MET";
            return finishedAt.isAfter(wo.getSlaDueAt()) ? "BREACHED" : "MET";
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(wo.getSlaDueAt())) return "BREACHED";
        if (now.isAfter(wo.getSlaDueAt().minusHours(2))) return "AT_RISK";
        return "ON_TRACK";
    }

    private WorkOrderDtos.WorkOrderResponse toResponse(WorkOrder wo) {
        return new WorkOrderDtos.WorkOrderResponse(
                wo.getId(), wo.getCode(), wo.getTitle(), wo.getPriority().name(), wo.getStatus().name(),
                wo.getSlaDueAt(), slaStatus(wo),
                wo.getCustomer().getId(), wo.getCustomer().getName(),
                wo.getSite().getId(), wo.getSite().getName(),
                wo.getAssignedTo() != null ? wo.getAssignedTo().getId() : null,
                wo.getAssignedTo() != null ? wo.getAssignedTo().getName() : null,
                wo.getCreatedAt(), wo.getUpdatedAt());
    }

    private StatusHistoryDtos.StatusHistoryResponse toHistoryResponse(WorkOrderStatusHistory h) {
        return new StatusHistoryDtos.StatusHistoryResponse(
                h.getId(),
                h.getFromStatus() != null ? h.getFromStatus().name() : null,
                h.getToStatus().name(),
                h.getChangedBy() != null ? h.getChangedBy().getName() : "System",
                h.getChangedAt(), h.getNote());
    }
}
