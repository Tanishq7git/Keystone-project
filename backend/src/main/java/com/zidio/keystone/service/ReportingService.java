package com.zidio.keystone.service;

import com.zidio.keystone.domain.Role;
import com.zidio.keystone.domain.User;
import com.zidio.keystone.domain.WorkOrder;
import com.zidio.keystone.domain.WorkOrderStatus;
import com.zidio.keystone.dto.ReportDtos;
import com.zidio.keystone.repository.SiteRepository;
import com.zidio.keystone.repository.UserRepository;
import com.zidio.keystone.repository.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportingService {

    private final WorkOrderRepository workOrderRepository;
    private final UserRepository userRepository;
    private final SiteRepository siteRepository;

    @Transactional(readOnly = true)
    public ReportDtos.DashboardSummaryResponse summary() {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (WorkOrderStatus s : WorkOrderStatus.values()) {
            counts.put(s.name(), 0L);
        }
        workOrderRepository.countGroupedByStatus()
                .forEach(row -> counts.put(row.getStatus().name(), row.getTotal()));

        long totalOpen = counts.entrySet().stream()
                .filter(e -> !e.getKey().equals("CLOSED") && !e.getKey().equals("CANCELLED"))
                .mapToLong(Map.Entry::getValue)
                .sum();

        long overdue = workOrderRepository.countOverdue(LocalDateTime.now());

        long finished = workOrderRepository.countCompletedOrClosed();
        long finishedWithinSla = workOrderRepository.countCompletedOrClosedWithinSla();
        double compliance = finished == 0 ? 100.0 : Math.round((finishedWithinSla * 1000.0 / finished)) / 10.0;

        List<ReportDtos.TechnicianWorkload> byTechnician = userRepository.findByRole(Role.TECHNICIAN).stream()
                .map(this::technicianWorkload)
                .toList();

        List<ReportDtos.SiteBreakdown> bySite = siteRepository.findAll().stream()
                .map(site -> new ReportDtos.SiteBreakdown(
                        site.getId(), site.getName(), site.getCustomer().getName(),
                        openJobsForSite(site.getId())))
                .filter(s -> s.openJobs() > 0)
                .toList();

        return new ReportDtos.DashboardSummaryResponse(counts, totalOpen, overdue, compliance, byTechnician, bySite);
    }

    private ReportDtos.TechnicianWorkload technicianWorkload(User tech) {
        long open = workOrderRepository.findAll().stream()
                .filter(w -> w.getAssignedTo() != null && w.getAssignedTo().getId().equals(tech.getId()))
                .filter(w -> !w.getStatus().isTerminal())
                .count();
        long completed = workOrderRepository.findAll().stream()
                .filter(w -> w.getAssignedTo() != null && w.getAssignedTo().getId().equals(tech.getId()))
                .filter(w -> w.getStatus() == WorkOrderStatus.COMPLETED || w.getStatus() == WorkOrderStatus.CLOSED)
                .count();
        return new ReportDtos.TechnicianWorkload(tech.getId(), tech.getName(), open, completed);
    }

    private long openJobsForSite(Long siteId) {
        return workOrderRepository.findAll().stream()
                .filter((WorkOrder w) -> w.getSite().getId().equals(siteId))
                .filter(w -> !w.getStatus().isTerminal())
                .count();
    }
}
