package com.company.trackingagent.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.company.trackingagent.service.sync.SyncProcessor;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class SyncScheduler {

    private final SyncProcessor syncProcessor;

    @Scheduled(
            initialDelayString = "${tracking.sync.initial-delay-ms}",
            fixedDelayString = "${tracking.sync.fixed-delay-ms}")
    public void execute() {

        log.debug("Sync scheduler triggered");

        syncProcessor.process();

    }
}
