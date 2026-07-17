package com.zidio.keystone.util;

import com.zidio.keystone.domain.Role;
import com.zidio.keystone.domain.WorkOrderStatus;
import org.junit.jupiter.api.Test;

import static com.zidio.keystone.domain.WorkOrderStatus.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Locks down the governed work-order lifecycle (brief Section 07 / Figure 4).
 * These are the rules the whole platform depends on — keep this test green.
 */
class WorkOrderLifecycleTest {

    @Test
    void allowsEachDocumentedTransition() {
        assertTrue(WorkOrderLifecycle.isAllowed(NEW, ASSIGNED));
        assertTrue(WorkOrderLifecycle.isAllowed(NEW, CANCELLED));
        assertTrue(WorkOrderLifecycle.isAllowed(ASSIGNED, IN_PROGRESS));
        assertTrue(WorkOrderLifecycle.isAllowed(ASSIGNED, CANCELLED));
        assertTrue(WorkOrderLifecycle.isAllowed(IN_PROGRESS, ON_HOLD));
        assertTrue(WorkOrderLifecycle.isAllowed(IN_PROGRESS, COMPLETED));
        assertTrue(WorkOrderLifecycle.isAllowed(ON_HOLD, IN_PROGRESS));
        assertTrue(WorkOrderLifecycle.isAllowed(COMPLETED, CLOSED));
        assertTrue(WorkOrderLifecycle.isAllowed(COMPLETED, IN_PROGRESS)); // reopen
    }

    @Test
    void rejectsIllegalJumps() {
        assertFalse(WorkOrderLifecycle.isAllowed(NEW, COMPLETED));
        assertFalse(WorkOrderLifecycle.isAllowed(NEW, IN_PROGRESS));
        assertFalse(WorkOrderLifecycle.isAllowed(NEW, CLOSED));
        assertFalse(WorkOrderLifecycle.isAllowed(ASSIGNED, COMPLETED));
        assertFalse(WorkOrderLifecycle.isAllowed(ASSIGNED, ON_HOLD));
    }

    @Test
    void terminalStatesHaveNoWayOut() {
        assertTrue(WorkOrderLifecycle.nextStates(CLOSED).isEmpty());
        assertTrue(WorkOrderLifecycle.nextStates(CANCELLED).isEmpty());
        for (WorkOrderStatus to : WorkOrderStatus.values()) {
            assertFalse(WorkOrderLifecycle.isAllowed(CLOSED, to));
            assertFalse(WorkOrderLifecycle.isAllowed(CANCELLED, to));
        }
    }

    @Test
    void onlyManagerCanCloseOrReopen() {
        assertTrue(WorkOrderLifecycle.roleCanPerform(COMPLETED, CLOSED, Role.MANAGER));
        assertFalse(WorkOrderLifecycle.roleCanPerform(COMPLETED, CLOSED, Role.DISPATCHER));
        assertFalse(WorkOrderLifecycle.roleCanPerform(COMPLETED, CLOSED, Role.TECHNICIAN));
        assertFalse(WorkOrderLifecycle.roleCanPerform(COMPLETED, CLOSED, Role.CUSTOMER));
    }

    @Test
    void onlyDispatcherOrManagerCanAssignOrCancelFromNew() {
        assertTrue(WorkOrderLifecycle.roleCanPerform(NEW, ASSIGNED, Role.DISPATCHER));
        assertTrue(WorkOrderLifecycle.roleCanPerform(NEW, ASSIGNED, Role.MANAGER));
        assertFalse(WorkOrderLifecycle.roleCanPerform(NEW, ASSIGNED, Role.TECHNICIAN));
        assertFalse(WorkOrderLifecycle.roleCanPerform(NEW, ASSIGNED, Role.CUSTOMER));
    }

    @Test
    void onlyTechnicianOrManagerCanStartOrCompleteWork() {
        assertTrue(WorkOrderLifecycle.roleCanPerform(ASSIGNED, IN_PROGRESS, Role.TECHNICIAN));
        assertTrue(WorkOrderLifecycle.roleCanPerform(IN_PROGRESS, COMPLETED, Role.TECHNICIAN));
        assertFalse(WorkOrderLifecycle.roleCanPerform(ASSIGNED, IN_PROGRESS, Role.DISPATCHER));
        assertFalse(WorkOrderLifecycle.roleCanPerform(ASSIGNED, IN_PROGRESS, Role.CUSTOMER));
    }
}
