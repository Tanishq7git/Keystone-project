package com.zidio.keystone.service;

import com.zidio.keystone.domain.WorkOrder;
import com.zidio.keystone.repository.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * F7 — SLA tracking & notifications. Runs periodically, flags any open work order
 * that has just passed its SLA due date, and raises a manager-facing notification.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SlaService {

    private final WorkOrderRepository workOrderRepository;
    private final NotificationService notificationService;

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void checkForBreaches() {
        List<WorkOrder> newlyBreached = workOrderRepository.findNewlyBreached(LocalDateTime.now());
        for (WorkOrder wo : newlyBreached) {
            wo.setSlaBreached(true);
            workOrderRepository.save(wo);
            notificationService.notifyBreach(wo);
            log.info("SLA breach flagged for {} ({})", wo.getCode(), wo.getTitle());
        }
    }
}
