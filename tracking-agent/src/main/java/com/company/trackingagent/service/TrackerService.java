package com.company.trackingagent.service;

import org.springframework.stereotype.Service;

import com.company.trackingagent.config.TrackingProperties;
import com.company.trackingagent.model.ActivityStatus;
import com.company.trackingagent.service.persistence.ActivityEventService;
import com.company.trackingagent.service.persistence.WindowEventService;
import com.company.trackingagent.service.sync.AgentDeviceStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrackerService {

    private final WindowEventService windowEventService;
    private final ActivityEventService activityEventService;
    private final TrackingProperties trackingProperties;
    private final AgentDeviceStateService agentDeviceStateService;
    

   public void start() {

    log.info("Tracker service initialization started: version={} syncEnabled={} batchSize={}",
            trackingProperties.getAgentVersion(),
            trackingProperties.getSync().isEnabled(),
            trackingProperties.getSync().getBatchSize());

    windowEventService.closeStaleSession();
    activityEventService.closeStaleSession();

    try {
        agentDeviceStateService.ensureRegistered();
    } catch (Exception exception) {
        log.error("Agent registration not completed during startup; tracking will not start until registration succeeds: {}",
                exception.getMessage());
        return;
    }

    // CREATE INITIAL ACTIVE SESSION only after registration is ready
    activityEventService.startNewSession(ActivityStatus.ACTIVE);

    log.info("Tracker service started successfully");
}
}
