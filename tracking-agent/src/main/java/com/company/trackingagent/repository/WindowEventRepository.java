package com.company.trackingagent.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.company.trackingagent.entity.WindowEvent;

public interface WindowEventRepository extends JpaRepository<WindowEvent, Long> {

    Optional<WindowEvent> findFirstByEndedAtIsNullOrderByIdDesc();

    List<WindowEvent> findBySyncedFalseAndEndedAtIsNotNullOrderByIdAsc(
            Pageable pageable);

    long deleteBySyncedTrueAndSyncedAtBefore(LocalDateTime cutoff);

}
