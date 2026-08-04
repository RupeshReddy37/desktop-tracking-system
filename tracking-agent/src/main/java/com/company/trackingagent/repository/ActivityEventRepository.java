package com.company.trackingagent.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.company.trackingagent.entity.ActivityEvent;

public interface ActivityEventRepository extends JpaRepository<ActivityEvent, Long> {

    Optional<ActivityEvent> findFirstByEndedAtIsNullOrderByIdDesc();

    List<ActivityEvent> findTop100BySyncedFalse();

    List<ActivityEvent> findBySyncedFalseAndEndedAtIsNotNullOrderByIdAsc(
            Pageable pageable);

    long deleteBySyncedTrueAndSyncedAtBefore(LocalDateTime cutoff);

}
