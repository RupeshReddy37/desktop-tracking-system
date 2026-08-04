package com.company.trackingagent.scheduler;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.company.trackingagent.monitor.ActivityMonitor;

@Slf4j
@Component
@RequiredArgsConstructor
public class ActivityScheduler {

    private final ActivityMonitor activityMonitor;

    @Scheduled(
            initialDelayString = "${tracking.activity.poll-initial-delay-ms}",
            fixedDelayString = "${tracking.activity.poll-delay-ms}")
    public void execute() {

        log.debug("Activity scheduler triggered");

        activityMonitor.monitor();

    }
}
