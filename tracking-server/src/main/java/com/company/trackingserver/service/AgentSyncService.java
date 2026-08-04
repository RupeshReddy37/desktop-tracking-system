package com.company.trackingserver.service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.trackingserver.dto.ActivityEventSyncItem;
import com.company.trackingserver.dto.AgentSyncRequest;
import com.company.trackingserver.dto.AgentSyncResponse;
import com.company.trackingserver.dto.SystemEventSyncItem;
import com.company.trackingserver.dto.WindowEventSyncItem;
import com.company.trackingserver.entity.ActivityEvent;
import com.company.trackingserver.entity.Device;
import com.company.trackingserver.entity.SystemEvent;
import com.company.trackingserver.entity.WindowEvent;
import com.company.trackingserver.repository.ActivityEventRepository;
import com.company.trackingserver.repository.DeviceRepository;
import com.company.trackingserver.repository.SystemEventRepository;
import com.company.trackingserver.repository.WindowEventRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgentSyncService {

    private final DeviceRepository deviceRepository;
    private final WindowEventRepository windowEventRepository;
    private final ActivityEventRepository activityEventRepository;
    private final SystemEventRepository systemEventRepository;

    @Transactional
    public AgentSyncResponse sync(AgentSyncRequest request) {

        Device device = deviceRepository.findById(request.getDeviceId())
                .orElseThrow(() -> new IllegalArgumentException("Device not found"));

        if (!Boolean.TRUE.equals(device.getActive())) {
            throw new IllegalArgumentException("Device is not active");
        }

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        int savedWindowEvents = 0;
        int savedActivityEvents = 0;
        int savedSystemEvents = 0;
        List<WindowEventSyncItem> windowEvents = request.getWindowEvents() == null
                ? List.of()
                : request.getWindowEvents();
        List<ActivityEventSyncItem> activityEvents = request.getActivityEvents() == null
                ? List.of()
                : request.getActivityEvents();
        List<SystemEventSyncItem> systemEvents = request.getSystemEvents() == null
                ? List.of()
                : request.getSystemEvents();

        validateWindowEvents(windowEvents, now);
        validateActivityEvents(activityEvents, now);
        validateSystemEvents(systemEvents, now);

        device.setLastSeenAt(now);
        device.setUpdatedAt(now);
        deviceRepository.save(device);

        for (WindowEventSyncItem item : windowEvents) {
            if (windowEventRepository.existsByDeviceIdAndAgentEventId(device.getId(), item.getAgentEventId())) {
                continue;
            }

            WindowEvent event = new WindowEvent();

            event.setDevice(device);
            event.setAgentEventId(item.getAgentEventId());
            event.setWindowTitle(item.getWindowTitle());
            event.setProcessName(item.getProcessName());
            event.setApplicationName(item.getApplicationName());
            event.setDocumentTitle(item.getDocumentTitle());
            event.setStartedAt(item.getStartedAt());
            event.setEndedAt(item.getEndedAt());
            event.setCreatedAt(now);
            event.setRecovered(Boolean.TRUE.equals(item.getRecovered()));

            windowEventRepository.save(event);
            savedWindowEvents++;
        }

        for (ActivityEventSyncItem item : activityEvents) {
            if (activityEventRepository.existsByDeviceIdAndAgentEventId(device.getId(), item.getAgentEventId())) {
                continue;
            }

            ActivityEvent event = new ActivityEvent();

            event.setDevice(device);
            event.setAgentEventId(item.getAgentEventId());
            event.setStatus(item.getStatus().name());
            event.setStartedAt(item.getStartedAt());
            event.setEndedAt(item.getEndedAt());
            event.setCreatedAt(now);
            event.setRecovered(Boolean.TRUE.equals(item.getRecovered()));

            activityEventRepository.save(event);
            savedActivityEvents++;
        }

        for (SystemEventSyncItem item : systemEvents) {
            if (systemEventRepository.existsByDeviceIdAndAgentEventId(
                    device.getId(),
                    item.getAgentEventId())) {
                continue;
            }

            SystemEvent event = new SystemEvent();

            event.setDevice(device);
            event.setAgentEventId(item.getAgentEventId());
            event.setType(item.getType().name());
            event.setObservedAt(item.getObservedAt());
            event.setCreatedAt(now);

            systemEventRepository.save(event);
            savedSystemEvents++;
        }

        log.info("Agent sync accepted: deviceId={} windowReceived={} windowSaved={} activityReceived={} activitySaved={} systemReceived={} systemSaved={}",
                device.getId(),
                windowEvents.size(),
                savedWindowEvents,
                activityEvents.size(),
                savedActivityEvents,
                systemEvents.size(),
                savedSystemEvents);

        return toResponse(
                request,
                windowEvents.size(),
                savedWindowEvents,
                activityEvents.size(),
                savedActivityEvents,
                systemEvents.size(),
                savedSystemEvents);
    }

    private void validateWindowEvents(
            List<WindowEventSyncItem> events,
            LocalDateTime now) {

        for (WindowEventSyncItem item : events) {
            Objects.requireNonNull(item, "window event item cannot be null");
            validateEventTiming(
                    item.getStartedAt(),
                    item.getEndedAt(),
                    now,
                    "window event");
        }
    }

    private void validateActivityEvents(
            List<ActivityEventSyncItem> events,
            LocalDateTime now) {

        for (ActivityEventSyncItem item : events) {
            Objects.requireNonNull(item, "activity event item cannot be null");
            validateEventTiming(
                    item.getStartedAt(),
                    item.getEndedAt(),
                    now,
                    "activity event");
        }
    }

    private void validateSystemEvents(
            List<SystemEventSyncItem> events,
            LocalDateTime now) {

        for (SystemEventSyncItem item : events) {
            Objects.requireNonNull(item, "system event item cannot be null");
            if (item.getObservedAt() == null) {
                throw new IllegalArgumentException("System event observedAt is required");
            }
            if (item.getObservedAt().isAfter(now.plusMinutes(1))) {
                throw new IllegalArgumentException("System event observedAt cannot be in the future");
            }
        }
    }

    private void validateEventTiming(
            LocalDateTime startedAt,
            LocalDateTime endedAt,
            LocalDateTime now,
            String eventType) {

        if (startedAt == null || endedAt == null) {
            throw new IllegalArgumentException(eventType + " timestamps are required");
        }
        if (startedAt.isAfter(endedAt)) {
            throw new IllegalArgumentException(eventType + " startedAt cannot be after endedAt");
        }
        if (startedAt.isAfter(now.plusMinutes(1)) || endedAt.isAfter(now.plusMinutes(1))) {
            throw new IllegalArgumentException(eventType + " timestamps cannot be in the future");
        }
        if (startedAt.until(endedAt, java.time.temporal.ChronoUnit.DAYS) > 7) {
            throw new IllegalArgumentException(eventType + " duration is too large");
        }
    }

    private AgentSyncResponse toResponse(
            AgentSyncRequest request,
            int receivedWindowEvents,
            int savedWindowEvents,
            int receivedActivityEvents,
            int savedActivityEvents,
            int receivedSystemEvents,
            int savedSystemEvents) {

        AgentSyncResponse response = new AgentSyncResponse();

        response.setSuccess(true);
        response.setDeviceId(request.getDeviceId());
        response.setReceivedWindowEvents(receivedWindowEvents);
        response.setSavedWindowEvents(savedWindowEvents);
        response.setReceivedActivityEvents(receivedActivityEvents);
        response.setSavedActivityEvents(savedActivityEvents);
        response.setReceivedSystemEvents(receivedSystemEvents);
        response.setSavedSystemEvents(savedSystemEvents);
        response.setMessage("Sync completed successfully");

        return response;
    }
}
