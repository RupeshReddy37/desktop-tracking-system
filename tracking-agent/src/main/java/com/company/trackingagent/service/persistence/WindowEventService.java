package com.company.trackingagent.service.persistence;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.trackingagent.config.TrackingProperties;
import com.company.trackingagent.entity.WindowEvent;
import com.company.trackingagent.model.ActiveWindowInfo;
import com.company.trackingagent.repository.WindowEventRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class WindowEventService {

    private final WindowEventRepository windowEventRepository;
    private final TrackingProperties trackingProperties;

    @Transactional(readOnly = true)
    public Optional<WindowEvent> getCurrentOpenSession() {

        return windowEventRepository.findFirstByEndedAtIsNullOrderByIdDesc();

    }

    @Transactional
    public void closeCurrentSession() {

        Optional<WindowEvent> currentSession = getCurrentOpenSession();

        if (currentSession.isEmpty()) {
            return;
        }

        WindowEvent event = currentSession.get();

        event.setEndedAt(resolveSafeEndTime(event, LocalDateTime.now(ZoneOffset.UTC)));

        windowEventRepository.save(event);

        log.debug("Window session closed: id={} process={}", event.getId(), event.getProcessName());

    }

    @Transactional
    public void closeStaleSession() {

        Optional<WindowEvent> currentSession = getCurrentOpenSession();

        if (currentSession.isEmpty()) {
            return;
        }

        WindowEvent event = currentSession.get();

        event.setEndedAt(resolveRecoveredEndTime(event));
        event.setRecovered(true);

        windowEventRepository.save(event);

        log.info("Stale window session recovered using last observation: id={}", event.getId());
    }

    @Transactional
    public WindowEvent startNewSession(ActiveWindowInfo activeWindow) {

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        WindowEvent event = new WindowEvent();

        event.setWindowTitle(activeWindow.getWindowTitle());
        event.setProcessName(activeWindow.getProcessName());
        event.setApplicationName(activeWindow.getApplicationName());
        event.setDocumentTitle(activeWindow.getDocumentTitle());
        event.setStartedAt(now);
        event.setLastObservedAt(now);
        event.setRecovered(false);

        WindowEvent savedEvent = windowEventRepository.save(event);

        log.debug("Window session started: id={} process={}", savedEvent.getId(), activeWindow.getProcessName());

        return savedEvent;

    }

    @Transactional
    public void mergeShortSession(
            ActiveWindowInfo activeWindow,
            long minimumSessionSeconds) {

        if (!hasUsableWindow(activeWindow)) {
            return;
        }

        Optional<WindowEvent> currentSession = getCurrentOpenSession();
        if (currentSession.isEmpty()) {
            startNewSession(activeWindow);
            return;
        }

        WindowEvent event = currentSession.get();
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        if (Duration.between(event.getStartedAt(), now).getSeconds() < minimumSessionSeconds) {
            event.setWindowTitle(activeWindow.getWindowTitle());
            event.setProcessName(activeWindow.getProcessName());
            event.setApplicationName(activeWindow.getApplicationName());
            event.setDocumentTitle(activeWindow.getDocumentTitle());
            event.setLastObservedAt(now);
            windowEventRepository.save(event);
            return;
        }

        closeCurrentSession();
        startNewSession(activeWindow);
    }

    @Transactional
    public void switchWindow(ActiveWindowInfo activeWindow) {

        closeCurrentSession();

        startNewSession(activeWindow);

    }

    @Transactional
    public void heartbeatAndRotateIfNeeded(ActiveWindowInfo activeWindow) {

        Optional<WindowEvent> currentSession = getCurrentOpenSession();

        if (currentSession.isEmpty()) {
            if (hasUsableWindow(activeWindow)) {
                startNewSession(activeWindow);
            }
            return;
        }

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        WindowEvent event = currentSession.get();
        event.setLastObservedAt(now);
        windowEventRepository.save(event);

        long maxSeconds = Math.max(
                60,
                trackingProperties.getActivity().getLongSessionMaxSeconds());

        if (Duration.between(event.getStartedAt(), now).getSeconds() >= maxSeconds
                && hasUsableWindow(activeWindow)) {
            event.setEndedAt(resolveSafeEndTime(event, now));
            windowEventRepository.save(event);
            startNewSession(activeWindow);
        }
    }

    @Transactional
    public long deleteSyncedBefore(LocalDateTime cutoff) {

        return windowEventRepository.deleteBySyncedTrueAndSyncedAtBefore(cutoff);
    }

    private boolean hasUsableWindow(ActiveWindowInfo activeWindow) {

        return activeWindow != null
                && activeWindow.getWindowTitle() != null
                && !activeWindow.getWindowTitle().isBlank();
    }

    private LocalDateTime resolveSafeEndTime(
            WindowEvent event,
            LocalDateTime candidate) {

        LocalDateTime endedAt = candidate != null
                ? candidate
                : LocalDateTime.now(ZoneOffset.UTC);

        if (endedAt.isBefore(event.getStartedAt())) {
            return event.getStartedAt();
        }

        return endedAt;
    }

    private LocalDateTime resolveRecoveredEndTime(WindowEvent event) {

        if (event.getLastObservedAt() != null) {
            return resolveSafeEndTime(event, event.getLastObservedAt());
        }

        LocalDateTime cappedEndTime = event.getStartedAt()
                .plusSeconds(Math.max(
                        60,
                        trackingProperties.getActivity().getLongSessionMaxSeconds()));
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        if (cappedEndTime.isAfter(now)) {
            return resolveSafeEndTime(event, now);
        }

        return resolveSafeEndTime(event, cappedEndTime);
    }

}
