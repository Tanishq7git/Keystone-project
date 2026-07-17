package com.zidio.keystone.service;

import com.zidio.keystone.domain.TimeLog;
import com.zidio.keystone.domain.User;
import com.zidio.keystone.domain.WorkOrder;
import com.zidio.keystone.dto.TimeLogDtos;
import com.zidio.keystone.repository.TimeLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TimeLogService {

    private final TimeLogRepository timeLogRepository;

    @Transactional
    public TimeLogDtos.TimeLogResponse log(WorkOrder workOrder, TimeLogDtos.TimeLogRequest request, User technician) {
        TimeLog entry = TimeLog.builder()
                .workOrder(workOrder)
                .technician(technician)
                .minutes(request.minutes())
                .note(request.note())
                .build();
        entry = timeLogRepository.save(entry);
        return toResponse(entry);
    }

    TimeLogDtos.TimeLogResponse toResponse(TimeLog t) {
        return new TimeLogDtos.TimeLogResponse(t.getId(), t.getMinutes(), t.getNote(), t.getTechnician().getName(), t.getLoggedAt());
    }
}
