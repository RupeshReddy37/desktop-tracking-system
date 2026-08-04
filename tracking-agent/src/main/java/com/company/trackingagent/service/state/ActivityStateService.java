package com.company.trackingagent.service.state;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.company.trackingagent.model.ActivityState;
import com.company.trackingagent.model.ActivityStatus;
import com.company.trackingagent.service.persistence.ActivityEventService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityStateService {

    private final ActivityState activityState;
    private final ActivityEventService activityEventService;

    public void changeStatus(
            ActivityStatus newStatus,
            LocalDateTime transitionStartedAt) {

        if (activityState.getCurrentStatus() == newStatus) {
            return;
        }

        ActivityStatus oldStatus = activityState.getCurrentStatus();

        activityState.setCurrentStatus(newStatus);
        activityState.setStatusChangedAt(transitionStartedAt);

        log.info("STATE CHANGED : {} -> {}", oldStatus, newStatus);

        // Save activity session to database
        activityEventService.switchStatus(
                newStatus,
                transitionStartedAt);
    }
}
