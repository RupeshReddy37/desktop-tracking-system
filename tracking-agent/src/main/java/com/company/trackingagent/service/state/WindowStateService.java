package com.company.trackingagent.service.state;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.stereotype.Service;

import com.company.trackingagent.model.ActiveWindowInfo;
import com.company.trackingagent.model.WindowState;
import com.company.trackingagent.service.persistence.WindowEventService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class WindowStateService {

    private final WindowState windowState;
    private final WindowEventService windowEventService;

    public void updateWindow(ActiveWindowInfo newWindow) {
        updateWindow(newWindow, 0L);
    }

    public void updateWindow(ActiveWindowInfo newWindow, long minimumSessionSeconds) {
        if (newWindow == null || newWindow.getWindowTitle() == null
                || newWindow.getWindowTitle().isBlank()) {
            return;
        }

        String newWindowTitle = newWindow.identity();

        if (windowState.getCurrentWindowTitle() != null && windowState.getCurrentWindowTitle().equals(newWindowTitle)) {
            return;
        }

        windowState.setCurrentWindowTitle(newWindowTitle);
        windowState.setWindowChangedAt(LocalDateTime.now(ZoneOffset.UTC));

        if (minimumSessionSeconds > 0) {
            windowEventService.mergeShortSession(newWindow, minimumSessionSeconds);
        } else {
            windowEventService.switchWindow(newWindow);
        }

        log.debug("Window state changed: process={}", newWindow.getProcessName());
    }
}
