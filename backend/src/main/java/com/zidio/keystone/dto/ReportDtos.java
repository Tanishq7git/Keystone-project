package com.zidio.keystone.dto;

import java.util.List;
import java.util.Map;

public class ReportDtos {

    public record DashboardSummaryResponse(
            Map<String, Long> countsByStatus,
            long totalOpen,
            long overdueCount,
            double slaCompliancePct,
            List<TechnicianWorkload> byTechnician,
            List<SiteBreakdown> bySite
    ) {}

    public record TechnicianWorkload(
            Long technicianId,
            String technicianName,
            long openJobs,
            long completedJobs
    ) {}

    public record SiteBreakdown(
            Long siteId,
            String siteName,
            String customerName,
            long openJobs
    ) {}
}
