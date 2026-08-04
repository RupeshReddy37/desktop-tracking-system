package com.company.trackingagent.service.persistence;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.trackingagent.entity.SystemEvent;
import com.company.trackingagent.model.SystemEventType;
import com.company.trackingagent.repository.SystemEventRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemEventService {

    private final SystemEventRepository systemEventRepository;

    @Transactional
    public SystemEvent record(SystemEventType type) {

        return record(type, LocalDateTime.now(ZoneOffset.UTC));
    }

    @Transactional
    public SystemEvent record(
            SystemEventType type,
            LocalDateTime observedAt) {

        SystemEvent event = new SystemEvent();
        event.setType(type.name());
        event.setObservedAt(observedAt);
        event.setSynced(false);

        SystemEvent savedEvent = systemEventRepository.save(event);

        log.info("System event recorded: type={} id={}",
                type,
                savedEvent.getId());

        return savedEvent;
    }

    @Transactional
    public long deleteSyncedBefore(LocalDateTime cutoff) {

        return systemEventRepository.deleteBySyncedTrueAndSyncedAtBefore(cutoff);
    }
}
