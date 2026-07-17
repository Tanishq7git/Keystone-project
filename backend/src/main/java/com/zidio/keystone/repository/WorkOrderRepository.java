package com.zidio.keystone.repository;

import com.zidio.keystone.domain.WorkOrder;
import com.zidio.keystone.domain.WorkOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long>, JpaSpecificationExecutor<WorkOrder> {

    Optional<WorkOrder> findByCode(String code);

    long countByStatus(WorkOrderStatus status);

    long countByCodeStartingWith(String prefix);

    @Query("select w.status as status, count(w) as total from WorkOrder w group by w.status")
    List<StatusCount> countGroupedByStatus();

    @Query("""
           select w from WorkOrder w
           where w.status not in ('CLOSED', 'CANCELLED')
             and w.slaDueAt is not null
             and w.slaDueAt < :now
             and w.slaBreached = false
           """)
    List<WorkOrder> findNewlyBreached(@Param("now") LocalDateTime now);

    @Query("select count(w) from WorkOrder w where w.status not in ('CLOSED','CANCELLED') and w.slaDueAt < :now")
    long countOverdue(@Param("now") LocalDateTime now);

    long countByAssignedToId(Long technicianId);

    @Query("select count(w) from WorkOrder w where w.status in ('CLOSED','COMPLETED')")
    long countCompletedOrClosed();

    @Query("select count(w) from WorkOrder w where w.status in ('CLOSED','COMPLETED') and w.slaBreached = false")
    long countCompletedOrClosedWithinSla();

    interface StatusCount {
        WorkOrderStatus getStatus();
        Long getTotal();
    }
}
