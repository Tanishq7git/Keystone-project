package com.zidio.keystone.repository;

import com.zidio.keystone.domain.PartUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PartUsageRepository extends JpaRepository<PartUsage, Long> {
    List<PartUsage> findByWorkOrderIdOrderByUsedAtAsc(Long workOrderId);
}
