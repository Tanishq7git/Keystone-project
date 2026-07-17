package com.zidio.keystone.controller;

import com.zidio.keystone.dto.ReportDtos;
import com.zidio.keystone.service.ReportingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Manager dashboard metrics")
public class ReportController {

    private final ReportingService reportingService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('MANAGER','DISPATCHER')")
    public ResponseEntity<ReportDtos.DashboardSummaryResponse> summary() {
        return ResponseEntity.ok(reportingService.summary());
    }
}
