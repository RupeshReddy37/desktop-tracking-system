package com.company.trackingserver.repository;

import com.company.trackingserver.entity.WindowEvent;
import com.company.trackingserver.dto.ApplicationUsageSummary;
import com.company.trackingserver.dto.DocumentUsageSummary;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface WindowEventRepository
        extends JpaRepository<WindowEvent, Long> {

    List<WindowEvent> findByDeviceId(Long deviceId);

    List<WindowEvent> findByDeviceIdAndStartedAtBetween(
            Long deviceId,
            LocalDateTime start,
            LocalDateTime end
    );

    @Query("""
            select w
            from WindowEvent w
            where w.device.id = :deviceId
              and w.startedAt < :end
              and (w.endedAt is null or w.endedAt > :start)
            order by w.startedAt asc
            """)
    List<WindowEvent> findOverlappingByDeviceId(
            @Param("deviceId") Long deviceId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    boolean existsByDeviceIdAndAgentEventId(
            Long deviceId,
            Long agentEventId
    );

    @Query(value = """
            select
                coalesce(application_name, 'Unknown') as applicationName,
                process_name as processName,
                cast(sum(extract(epoch from (ended_at - started_at))) as bigint) as totalSeconds
            from window_event
            where device_id = :deviceId
              and started_at >= :start
              and started_at < :end
              and ended_at is not null
            group by coalesce(application_name, 'Unknown'), process_name
            order by totalSeconds desc
            """, nativeQuery = true)
    List<ApplicationUsageSummary> summarizeApplicationUsage(
            @Param("deviceId") Long deviceId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query(value = """
            select
                coalesce(application_name, 'Unknown') as applicationName,
                coalesce(document_title, window_title) as documentTitle,
                cast(sum(extract(epoch from (ended_at - started_at))) as bigint) as totalSeconds
            from window_event
            where device_id = :deviceId
              and application_name = :applicationName
              and started_at >= :start
              and started_at < :end
              and ended_at is not null
            group by coalesce(application_name, 'Unknown'), coalesce(document_title, window_title)
            order by totalSeconds desc
            """, nativeQuery = true)
    List<DocumentUsageSummary> summarizeDocumentUsage(
            @Param("deviceId") Long deviceId,
            @Param("applicationName") String applicationName,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
