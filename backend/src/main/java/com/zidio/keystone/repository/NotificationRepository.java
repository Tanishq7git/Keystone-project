package com.zidio.keystone.repository;

import com.zidio.keystone.domain.Notification;
import com.zidio.keystone.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByTargetRoleOrderByCreatedAtDesc(Role role);
    List<Notification> findByTargetUserIdOrderByCreatedAtDesc(Long userId);
}
