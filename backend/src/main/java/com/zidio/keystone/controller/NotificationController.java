package com.zidio.keystone.controller;

import com.zidio.keystone.dto.NotificationDtos;
import com.zidio.keystone.security.UserPrincipal;
import com.zidio.keystone.service.NotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Assignment and SLA-breach alerts")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificationDtos.NotificationResponse>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(notificationService.forUser(principal));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return ResponseEntity.noContent().build();
    }
}
