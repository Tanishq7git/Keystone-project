package com.zidio.keystone.util;

import com.zidio.keystone.domain.Role;
import com.zidio.keystone.domain.WorkOrderStatus;

import java.util.Arrays;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static com.zidio.keystone.domain.WorkOrderStatus.*;

/**
 * The governed work-order state machine (brief Section 07).
 * Only the transitions declared here are legal; every other change is rejected
 * with a 409. Each transition also names which roles may perform it — the
 * service layer additionally checks that a TECHNICIAN transition is done by
 * the technician the job is actually assigned to.
 */
public final class WorkOrderLifecycle {

    private WorkOrderLifecycle() {}

    private static final Map<WorkOrderStatus, Set<WorkOrderStatus>> ALLOWED = new EnumMap<>(WorkOrderStatus.class);
    private static final Map<String, Set<Role>> TRANSITION_ROLES = new HashMap<>();

    static {
        ALLOWED.put(NEW, EnumSet.of(ASSIGNED, CANCELLED));
        ALLOWED.put(ASSIGNED, EnumSet.of(IN_PROGRESS, CANCELLED));
        ALLOWED.put(IN_PROGRESS, EnumSet.of(ON_HOLD, COMPLETED));
        ALLOWED.put(ON_HOLD, EnumSet.of(IN_PROGRESS));
        ALLOWED.put(COMPLETED, EnumSet.of(CLOSED, IN_PROGRESS)); // "reopen" per Figure 4
        ALLOWED.put(CLOSED, EnumSet.noneOf(WorkOrderStatus.class));
        ALLOWED.put(CANCELLED, EnumSet.noneOf(WorkOrderStatus.class));

        role(NEW, ASSIGNED, Role.DISPATCHER, Role.MANAGER);
        role(NEW, CANCELLED, Role.DISPATCHER, Role.MANAGER);
        role(ASSIGNED, IN_PROGRESS, Role.TECHNICIAN, Role.MANAGER);
        role(ASSIGNED, CANCELLED, Role.DISPATCHER, Role.MANAGER);
        role(IN_PROGRESS, ON_HOLD, Role.TECHNICIAN, Role.MANAGER);
        role(IN_PROGRESS, COMPLETED, Role.TECHNICIAN, Role.MANAGER);
        role(ON_HOLD, IN_PROGRESS, Role.TECHNICIAN, Role.MANAGER);
        role(COMPLETED, CLOSED, Role.MANAGER);
        role(COMPLETED, IN_PROGRESS, Role.MANAGER);
    }

    private static void role(WorkOrderStatus from, WorkOrderStatus to, Role... roles) {
        TRANSITION_ROLES.put(key(from, to), EnumSet.copyOf(Arrays.asList(roles)));
    }

    private static String key(WorkOrderStatus from, WorkOrderStatus to) {
        return from.name() + "->" + to.name();
    }

    public static boolean isAllowed(WorkOrderStatus from, WorkOrderStatus to) {
        return ALLOWED.getOrDefault(from, EnumSet.noneOf(WorkOrderStatus.class)).contains(to);
    }

    public static boolean roleCanPerform(WorkOrderStatus from, WorkOrderStatus to, Role role) {
        Set<Role> roles = TRANSITION_ROLES.get(key(from, to));
        return roles != null && roles.contains(role);
    }

    /** True for a transition that only the technician the job is assigned to may perform (not any technician). */
    public static boolean requiresAssignedTechnician(WorkOrderStatus from, WorkOrderStatus to, Role actingRole) {
        return actingRole == Role.TECHNICIAN
                && Set.of(ASSIGNED, IN_PROGRESS, ON_HOLD).contains(from);
    }

    public static Set<WorkOrderStatus> nextStates(WorkOrderStatus from) {
        return ALLOWED.getOrDefault(from, EnumSet.noneOf(WorkOrderStatus.class));
    }
}
