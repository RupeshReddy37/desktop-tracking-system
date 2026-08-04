package com.company.trackingagent.monitor;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.stereotype.Component;

import com.company.trackingagent.config.TrackingProperties;
import com.company.trackingagent.model.SystemEventType;
import com.company.trackingagent.service.persistence.SystemEventService;
import com.company.trackingagent.windows.WindowsLockStateMonitor;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class SystemEventMonitor {

    private final WindowsLockStateMonitor windowsLockStateMonitor;
    private final SystemEventService systemEventService;
    private final TrackingProperties trackingProperties;

    private Boolean lastLocked;
    private LocalDateTime lastPollAt;

    public void monitor() {

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        recordSuspendResumeIfSchedulerWasPaused(now);
        recordLockStateChange();
        lastPollAt = now;
    }

    private void recordSuspendResumeIfSchedulerWasPaused(LocalDateTime now) {

        if (lastPollAt == null) {
            return;
        }

        long gapSeconds = Duration.between(lastPollAt, now).getSeconds();
        long thresholdSeconds = Math.max(
                30,
                trackingProperties.getActivity().getSuspendResumeGapSeconds());

        if (gapSeconds > thresholdSeconds) {
            systemEventService.record(SystemEventType.SUSPEND, lastPollAt);
            systemEventService.record(SystemEventType.RESUME, now);
        }
    }

    private void recordLockStateChange() {

        boolean locked = windowsLockStateMonitor.isLocked();

        if (lastLocked == null) {
            lastLocked = locked;
            return;
        }

        if (lastLocked.booleanValue() == locked) {
            return;
        }

        systemEventService.record(locked
                ? SystemEventType.LOCK
                : SystemEventType.UNLOCK);

        lastLocked = locked;
    }
}
