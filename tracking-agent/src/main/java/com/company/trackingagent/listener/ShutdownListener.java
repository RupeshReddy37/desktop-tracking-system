package com.company.trackingagent.listener;

import org.springframework.stereotype.Component;

import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class ShutdownListener {

    private final ShutdownCoordinator shutdownCoordinator;

    @PreDestroy
    public void onShutdown() {

        log.info("Application shutdown detected");
        shutdownCoordinator.closeSessionsAndSync("spring-predestroy");

    }
}
