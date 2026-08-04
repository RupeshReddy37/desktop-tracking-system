package com.company.trackingagent.service.persistence;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.trackingagent.config.TrackingProperties;
import com.company.trackingagent.entity.ActivityEvent;
import com.company.trackingagent.model.ActivityStatus;
import com.company.trackingagent.repository.ActivityEventRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityEventService {

    private final ActivityEventRepository activityEventRepository;
    private final TrackingProperties trackingProperties;

    @Transactional(readOnly = true)
    public Optional<ActivityEvent> getCurrentOpenSession() {

        return activityEventRepository.findFirstByEndedAtIsNullOrderByIdDesc();
    }

    @Transactional
    public void closeCurrentSession() {

        closeCurrentSession(LocalDateTime.now(ZoneOffset.UTC));
    }

    @Transactional
    public void closeCurrentSession(LocalDateTime endedAt) {

        Optional<ActivityEvent> currentSession = getCurrentOpenSession();

        if (currentSession.isEmpty()) {
            log.debug("No open activity session found");
            return;
        }

        ActivityEvent event = currentSession.get();
        event.setEndedAt(resolveSafeEndTime(event, endedAt));

        activityEventRepository.save(event);

        log.debug("Activity session closed: id={} status={}",
                event.getId(),
                event.getStatus());
    }

    @Transactional
    public ActivityEvent startNewSession(ActivityStatus status) {

        return startNewSession(
                status,
                LocalDateTime.now(ZoneOffset.UTC));
    }

    @Transactional
    public ActivityEvent startNewSession(
            ActivityStatus status,
            LocalDateTime startedAt) {

        log.debug("Creating activity session: {}", status);

        ActivityEvent event = new ActivityEvent();

        event.setStatus(status.name());
        event.setStartedAt(startedAt);
        event.setLastObservedAt(startedAt);
        event.setEndedAt(null);
        event.setSynced(false);
        event.setRecovered(false);

        ActivityEvent savedEvent = activityEventRepository.save(event);

        log.debug("Activity session saved: id={} status={}",
                savedEvent.getId(),
                savedEvent.getStatus());

        return savedEvent;
    }

    @Transactional
    public void switchStatus(
            ActivityStatus status,
            LocalDateTime transitionStartedAt) {

        log.info("Switching activity status to {}", status);

        closeCurrentSession(transitionStartedAt);
        startNewSession(status, transitionStartedAt);
    }

    @Transactional
    public void closeStaleSession() {

        Optional<ActivityEvent> currentSession = getCurrentOpenSession();

        if (currentSession.isPresent()) {
            ActivityEvent event = currentSession.get();

            event.setEndedAt(resolveRecoveredEndTime(event));
            event.setRecovered(true);

            activityEventRepository.save(event);

            log.info("Stale activity session recovered using bounded end time: id={} status={}",
                    event.getId(),
                    event.getStatus());
        }
    }

    @Transactional
    public void heartbeatAndRotateIfNeeded(ActivityStatus status) {

        Optional<ActivityEvent> currentSession = getCurrentOpenSession();

        if (currentSession.isEmpty()) {
            startNewSession(status);
            return;
        }

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        ActivityEvent event = currentSession.get();
        event.setLastObservedAt(now);
        activityEventRepository.save(event);

        long maxSeconds = Math.max(
                60,
                trackingProperties.getActivity().getLongSessionMaxSeconds());

        if (Duration.between(event.getStartedAt(), now).getSeconds() >= maxSeconds) {
            event.setEndedAt(resolveSafeEndTime(event, now));
            activityEventRepository.save(event);
            startNewSession(status, now);
        }
    }

    @Transactional
    public long deleteSyncedBefore(LocalDateTime cutoff) {

        return activityEventRepository.deleteBySyncedTrueAndSyncedAtBefore(cutoff);
    }

    private LocalDateTime resolveSafeEndTime(
            ActivityEvent event,
            LocalDateTime candidate) {

        LocalDateTime endedAt = candidate != null
                ? candidate
                : LocalDateTime.now(ZoneOffset.UTC);

        if (endedAt.isBefore(event.getStartedAt())) {
            return event.getStartedAt();
        }

        return endedAt;
    }

    private LocalDateTime resolveRecoveredEndTime(ActivityEvent event) {

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
