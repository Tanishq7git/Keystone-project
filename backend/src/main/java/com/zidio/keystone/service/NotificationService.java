package com.zidio.keystone.service;

import com.zidio.keystone.domain.Notification;
import com.zidio.keystone.domain.Role;
import com.zidio.keystone.domain.User;
import com.zidio.keystone.domain.WorkOrder;
import com.zidio.keystone.dto.NotificationDtos;
import com.zidio.keystone.repository.NotificationRepository;
import com.zidio.keystone.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void notifyAssignment(WorkOrder wo, User technician) {
        Notification n = Notification.builder()
                .targetUser(technician)
                .message("You've been assigned " + wo.getCode() + ": " + wo.getTitle())
                .workOrder(wo)
                .read(false)
                .build();
        notificationRepository.save(n);
    }

    @Transactional
    public void notifyBreach(WorkOrder wo) {
        Notification n = Notification.builder()
                .targetRole(Role.MANAGER)
                .message("Work order " + wo.getCode() + " (" + wo.getTitle() + ") has breached its SLA.")
                .workOrder(wo)
                .read(false)
                .build();
        notificationRepository.save(n);
    }

    @Transactional(readOnly = true)
    public List<NotificationDtos.NotificationResponse> forUser(UserPrincipal principal) {
        List<Notification> byUser = notificationRepository.findByTargetUserIdOrderByCreatedAtDesc(principal.getId());
        List<Notification> byRole = notificationRepository.findByTargetRoleOrderByCreatedAtDesc(Role.valueOf(principal.getRole()));
        return java.util.stream.Stream.concat(byUser.stream(), byRole.stream())
                .distinct()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void markRead(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    private NotificationDtos.NotificationResponse toResponse(Notification n) {
        return new NotificationDtos.NotificationResponse(
                n.getId(), n.getMessage(),
                n.getWorkOrder() != null ? n.getWorkOrder().getId() : null,
                n.getWorkOrder() != null ? n.getWorkOrder().getCode() : null,
                n.isRead(), n.getCreatedAt());
    }
}
