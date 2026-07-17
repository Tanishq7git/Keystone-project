package com.zidio.keystone.repository;

import com.zidio.keystone.domain.TimeLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimeLogRepository extends JpaRepository<TimeLog, Long> {
    List<TimeLog> findByWorkOrderIdOrderByLoggedAtAsc(Long workOrderId);
}
