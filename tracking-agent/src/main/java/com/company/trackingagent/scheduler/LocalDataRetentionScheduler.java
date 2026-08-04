package com.company.trackingagent.scheduler;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.company.trackingagent.config.TrackingProperties;
import com.company.trackingagent.service.persistence.ActivityEventService;
import com.company.trackingagent.service.persistence.SystemEventService;
import com.company.trackingagent.service.persistence.WindowEventService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class LocalDataRetentionScheduler {

    private final TrackingProperties trackingProperties;
    private final WindowEventService windowEventService;
    private final ActivityEventService activityEventService;
    private final SystemEventService systemEventService;
    private final ReentrantLock monitorLock;

    @Scheduled(
            initialDelayString = "${tracking.retention.initial-delay-ms}",
            fixedDelayString = "${tracking.retention.fixed-delay-ms}")
    public void execute() {

        if (!monitorLock.tryLock()) {
            log.debug("Skipping local retention because another agent task is already using the database");
            return;
        }

        try {

            long retentionDays = Math.max(
                    1,
                    trackingProperties.getSync().getRetentionDaysAfterSync());

            LocalDateTime cutoff = LocalDateTime.now(ZoneOffset.UTC)
                    .minusDays(retentionDays);

            long deletedWindowEvents = windowEventService.deleteSyncedBefore(cutoff);
            long deletedActivityEvents = activityEventService.deleteSyncedBefore(cutoff);
            long deletedSystemEvents = systemEventService.deleteSyncedBefore(cutoff);

            if (deletedWindowEvents > 0 || deletedActivityEvents > 0 || deletedSystemEvents > 0) {
                log.info("Deleted synced local events older than {} days: window={}, activity={}, system={}",
                        retentionDays,
                        deletedWindowEvents,
                        deletedActivityEvents,
                        deletedSystemEvents);
            }
        } finally {
            monitorLock.unlock();
        }
    }
}
