package com.company.trackingagent.service.sync;

import java.util.List;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.company.trackingagent.config.TrackingProperties;
import com.company.trackingagent.dto.ActivityEventSyncItem;
import com.company.trackingagent.dto.AgentSyncRequest;
import com.company.trackingagent.dto.AgentSyncResponse;
import com.company.trackingagent.dto.SystemEventSyncItem;
import com.company.trackingagent.dto.WindowEventSyncItem;
import com.company.trackingagent.entity.ActivityEvent;
import com.company.trackingagent.entity.AgentDeviceState;
import com.company.trackingagent.entity.SystemEvent;
import com.company.trackingagent.entity.WindowEvent;
import com.company.trackingagent.repository.ActivityEventRepository;
import com.company.trackingagent.repository.SystemEventRepository;
import com.company.trackingagent.repository.WindowEventRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class SyncProcessor {

        private final TrackingProperties trackingProperties;
        private final AgentDeviceStateService agentDeviceStateService;
        private final AgentHttpClient agentHttpClient;
        private final WindowEventRepository windowEventRepository;
        private final ActivityEventRepository activityEventRepository;
        private final SystemEventRepository systemEventRepository;
        private final ReentrantLock monitorLock;

        public boolean process() {

                if (!monitorLock.tryLock()) {
                        log.debug("Skipping sync because another agent task is already using the database");
                        return false;
                }

                try {

                        if (!trackingProperties.getSync().isEnabled()) {
                                log.debug("Agent sync is disabled");
                                return false;
                        }

                        int batchSize = Math.max(
                                        1,
                                        trackingProperties.getSync().getBatchSize());

                        List<WindowEvent> windowEvents = windowEventRepository
                                        .findBySyncedFalseAndEndedAtIsNotNullOrderByIdAsc(
                                                        PageRequest.of(0, batchSize));

                        List<ActivityEvent> activityEvents = activityEventRepository
                                        .findBySyncedFalseAndEndedAtIsNotNullOrderByIdAsc(
                                                        PageRequest.of(0, batchSize));

                        List<SystemEvent> systemEvents = systemEventRepository
                                        .findBySyncedFalseOrderByIdAsc(
                                                        PageRequest.of(0, batchSize));

                        if (windowEvents.isEmpty() && activityEvents.isEmpty()
                                        && systemEvents.isEmpty()) {
                                log.debug("No closed events pending sync");
                                return false;
                        }

                        log.info("Sync started: windowPending={} activityPending={} systemPending={}",
                                        windowEvents.size(),
                                        activityEvents.size(),
                                        systemEvents.size());

                        AgentDeviceState state = agentDeviceStateService.ensureRegistered();

                        AgentSyncRequest request = new AgentSyncRequest();

                        request.setDeviceId(state.getServerDeviceId());
                        request.setWindowEvents(toWindowItems(windowEvents));
                        request.setActivityEvents(toActivityItems(activityEvents));
                        request.setSystemEvents(toSystemItems(systemEvents));

                        AgentSyncResponse response = agentHttpClient.sync(request);

                        if (!Boolean.TRUE.equals(response.getSuccess())) {
                                throw new IllegalStateException(
                                                "Server rejected sync: "
                                                                + response.getMessage());
                        }

                        markSynced(windowEvents, activityEvents, systemEvents);
                        agentDeviceStateService.markSyncCompleted(state);

                        log.info("Sync completed. window received={} saved={}, activity received={} saved={}, system received={} saved={}",
                                        response.getReceivedWindowEvents(),
                                        response.getSavedWindowEvents(),
                                        response.getReceivedActivityEvents(),
                                        response.getSavedActivityEvents(),
                                        response.getReceivedSystemEvents(),
                                        response.getSavedSystemEvents());
                        return true;
                } catch (InterruptedException exception) {
                        Thread.currentThread().interrupt();
                        throw new IllegalStateException(
                                        "Interrupted during agent sync",
                                        exception);
                } catch (Exception exception) {
                        log.warn("Agent sync failed: {}", exception.getMessage());
                        return false;
                } finally {
                        monitorLock.unlock();
                }
        }

        public void processUntilIdle(Duration maxDuration) {

                Instant deadline = Instant.now().plus(maxDuration);

                while (Instant.now().isBefore(deadline)) {
                        boolean syncedBatch = process();

                        if (!syncedBatch || Thread.currentThread().isInterrupted()) {
                                return;
                        }
                }
        }

        private List<WindowEventSyncItem> toWindowItems(
                        List<WindowEvent> events) {

                return events.stream()
                                .map(event -> {
                                        WindowEventSyncItem item = new WindowEventSyncItem();

                                        item.setAgentEventId(event.getId());
                                        item.setWindowTitle(event.getWindowTitle());
                                        item.setProcessName(event.getProcessName());
                                        item.setApplicationName(event.getApplicationName());
                                        item.setDocumentTitle(event.getDocumentTitle());
                                        item.setStartedAt(event.getStartedAt());
                                        item.setEndedAt(event.getEndedAt());
                                        item.setRecovered(event.isRecovered());

                                        return item;
                                })
                                .toList();
        }

        private List<ActivityEventSyncItem> toActivityItems(
                        List<ActivityEvent> events) {

                return events.stream()
                                .map(event -> {
                                        ActivityEventSyncItem item = new ActivityEventSyncItem();

                                        item.setAgentEventId(event.getId());
                                        item.setStatus(event.getStatus());
                                        item.setStartedAt(event.getStartedAt());
                                        item.setEndedAt(event.getEndedAt());
                                        item.setRecovered(event.isRecovered());

                                        return item;
                                })
                                .toList();
        }

        private List<SystemEventSyncItem> toSystemItems(
                        List<SystemEvent> events) {

                return events.stream()
                                .map(event -> {
                                        SystemEventSyncItem item = new SystemEventSyncItem();

                                        item.setAgentEventId(event.getId());
                                        item.setType(event.getType());
                                        item.setObservedAt(event.getObservedAt());

                                        return item;
                                })
                                .toList();
        }

        private void markSynced(
                        List<WindowEvent> windowEvents,
                        List<ActivityEvent> activityEvents,
                        List<SystemEvent> systemEvents) {

                LocalDateTime syncedAt = LocalDateTime.now(ZoneOffset.UTC);

                windowEvents.forEach(event -> event.setSynced(true));
                activityEvents.forEach(event -> event.setSynced(true));
                systemEvents.forEach(event -> event.setSynced(true));
                windowEvents.forEach(event -> event.setSyncedAt(syncedAt));
                activityEvents.forEach(event -> event.setSyncedAt(syncedAt));
                systemEvents.forEach(event -> event.setSyncedAt(syncedAt));

                windowEventRepository.saveAll(windowEvents);
                activityEventRepository.saveAll(activityEvents);
                systemEventRepository.saveAll(systemEvents);
        }
}
