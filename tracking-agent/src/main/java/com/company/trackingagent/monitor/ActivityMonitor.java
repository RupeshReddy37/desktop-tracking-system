package com.company.trackingagent.monitor;

import com.company.trackingagent.collector.IdleCollector;
import com.company.trackingagent.collector.WindowCollector;
import com.company.trackingagent.model.ActiveWindowInfo;
import com.company.trackingagent.model.ActivityStatus;
import com.company.trackingagent.service.persistence.ActivityEventService;
import com.company.trackingagent.service.persistence.WindowEventService;
import com.company.trackingagent.state.AgentState;
import com.company.trackingagent.state.AgentStateManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.locks.ReentrantLock;

@Slf4j
@Component
@RequiredArgsConstructor
public class ActivityMonitor {

    private final AgentStateManager agentStateManager;
    private final WindowCollector windowCollector;
    private final IdleCollector idleCollector;
    private final WindowEventService windowEventService;
    private final ActivityEventService activityEventService;
    private final SystemEventMonitor systemEventMonitor;
    private final ReentrantLock monitorLock;

    public void monitor() {
        if (!monitorLock.tryLock()) {
            log.debug("Skipping activity monitor run because a previous run is still in progress");
            return;
        }

        try {
            systemEventMonitor.monitor();

            ActiveWindowInfo activeWindow = windowCollector.collect();
            long idleSeconds = idleCollector.collect();
            log.debug("Active window observed: process={}",
                    activeWindow == null ? null : activeWindow.getProcessName());

            agentStateManager.update(activeWindow, idleSeconds);

            AgentState agentState = agentStateManager.getAgentState();
            ActivityStatus currentStatus = agentState.getCurrentActivityStatus() == null
                    ? ActivityStatus.ACTIVE
                    : agentState.getCurrentActivityStatus();

            windowEventService.heartbeatAndRotateIfNeeded(activeWindow);
            activityEventService.heartbeatAndRotateIfNeeded(currentStatus);

            log.debug("Activity status={} changedAt={} idleSeconds={}",
                    currentStatus,
                    agentState.getSessionStartTime(),
                    idleSeconds);
        } finally {
            monitorLock.unlock();
        }

    }
}
