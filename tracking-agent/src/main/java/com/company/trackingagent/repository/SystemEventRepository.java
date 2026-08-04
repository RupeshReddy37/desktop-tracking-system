package com.company.trackingagent.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.company.trackingagent.entity.SystemEvent;

public interface SystemEventRepository extends JpaRepository<SystemEvent, Long> {

    List<SystemEvent> findBySyncedFalseOrderByIdAsc(Pageable pageable);

    long deleteBySyncedTrueAndSyncedAtBefore(LocalDateTime cutoff);
}
