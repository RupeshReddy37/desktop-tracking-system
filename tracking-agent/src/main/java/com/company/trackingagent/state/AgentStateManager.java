package com.company.trackingagent.state;

import com.company.trackingagent.model.ActivityStatus;
import com.company.trackingagent.model.ActiveWindowInfo;
import com.company.trackingagent.config.TrackingProperties;
import com.company.trackingagent.processor.ActivityProcessor;
import com.company.trackingagent.processor.WindowProcessor;
import com.company.trackingagent.processor.WindowProcessor.WindowChangeResult;
import com.company.trackingagent.service.state.ActivityStateService;
import com.company.trackingagent.service.state.WindowStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Slf4j
@Component
@RequiredArgsConstructor
public class AgentStateManager {

    private final WindowStateService windowStateService;
    private final ActivityStateService activityStateService;
    private final WindowProcessor windowProcessor;
    private final ActivityProcessor activityProcessor;
    private final TrackingProperties trackingProperties;

    private AgentState agentState = new AgentState();

    public void update(ActiveWindowInfo activeWindow, long idleSeconds) {

        // Process window change
        WindowChangeResult windowResult = windowProcessor.process(
                agentState.getCurrentWindow(),
                activeWindow);

        boolean windowChanged = windowResult.isChanged();
        ActiveWindowInfo newWindow = windowResult.getNewWindow();

        // Process activity status change
        ActivityStatus newActivityStatus = activityProcessor.process(
                idleSeconds,
                agentState.getCurrentActivityStatus());

        boolean activityChanged = !newActivityStatus.equals(
                agentState.getCurrentActivityStatus());

        // Window tracking
        if (windowChanged) {
            long debounceSeconds = Math.max(
                    1,
                    trackingProperties.getActivity().getWindowSwitchDebounceSeconds());

            windowStateService.updateWindow(newWindow, debounceSeconds);

            log.debug(
                    "Foreground window changed: process={}",
                    newWindow.getProcessName());

            agentState.setCurrentWindow(newWindow.identity());
        }

        // Activity tracking
        if (activityChanged) {

            LocalDateTime transitionStartedAt =
                    resolveActivityTransitionStart(
                            newActivityStatus,
                            idleSeconds);

            activityStateService.changeStatus(
                    newActivityStatus,
                    transitionStartedAt);

            log.info(
                    "ACTIVITY STATUS CHANGED : {} -> {}",
                    agentState.getCurrentActivityStatus(),
                    newActivityStatus);

            agentState.setCurrentActivityStatus(newActivityStatus);

            // Activity session start time should change ONLY when
            // activity status changes (ACTIVE <-> IDLE)
            agentState.setSessionStartTime(transitionStartedAt);

            log.debug(
                    "Activity session started at {}",
                    agentState.getSessionStartTime());
        }

        // Derived idle flag
        boolean currentIdleStatus = newActivityStatus == ActivityStatus.IDLE;

        if (currentIdleStatus != agentState.isCurrentIdleStatus()) {

            agentState.setCurrentIdleStatus(currentIdleStatus);
        }
    }

    public AgentState getAgentState() {

        return agentState;
    }

    private LocalDateTime resolveActivityTransitionStart(
            ActivityStatus newActivityStatus,
            long idleSeconds) {

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        if (newActivityStatus == ActivityStatus.IDLE) {
            return now.minusSeconds(idleSeconds);
        }

        return now;
    }
}
