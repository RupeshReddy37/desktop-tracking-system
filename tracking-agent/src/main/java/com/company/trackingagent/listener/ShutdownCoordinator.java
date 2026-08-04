package com.company.trackingagent.listener;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.stereotype.Component;

import com.company.trackingagent.config.TrackingProperties;
import com.company.trackingagent.service.persistence.ActivityEventService;
import com.company.trackingagent.service.persistence.WindowEventService;
import com.company.trackingagent.service.sync.SyncProcessor;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class ShutdownCoordinator {

    private final WindowEventService windowEventService;
    private final ActivityEventService activityEventService;
    private final SyncProcessor syncProcessor;
    private final TrackingProperties trackingProperties;
    private final AtomicBoolean shutdownStarted = new AtomicBoolean(false);

    public void closeSessionsAndSync(String reason) {

        if (!shutdownStarted.compareAndSet(false, true)) {
            return;
        }

        log.info("Agent shutdown handling started: reason={}", reason);

        try {
            windowEventService.closeCurrentSession();
            activityEventService.closeCurrentSession();
            syncProcessor.processUntilIdle(Duration.ofSeconds(
                    Math.max(1, trackingProperties.getSync().getShutdownTimeoutSeconds())));
        } catch (Exception exception) {
            log.warn("Agent shutdown handling did not complete cleanly: {}", exception.getMessage());
        }
    }
}
