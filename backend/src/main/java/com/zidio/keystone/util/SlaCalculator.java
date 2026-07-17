package com.zidio.keystone.util;

import com.zidio.keystone.domain.Priority;

import java.time.LocalDateTime;

/** Turns a work order's priority into an SLA due date, per the hours configured in application.yml. */
public class SlaCalculator {

    private final long urgentHours;
    private final long highHours;
    private final long mediumHours;
    private final long lowHours;

    public SlaCalculator(long urgentHours, long highHours, long mediumHours, long lowHours) {
        this.urgentHours = urgentHours;
        this.highHours = highHours;
        this.mediumHours = mediumHours;
        this.lowHours = lowHours;
    }

    public LocalDateTime dueFrom(LocalDateTime start, Priority priority) {
        long hours = switch (priority) {
            case URGENT -> urgentHours;
            case HIGH -> highHours;
            case MEDIUM -> mediumHours;
            case LOW -> lowHours;
        };
        return start.plusHours(hours);
    }
}
