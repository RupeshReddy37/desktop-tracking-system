package com.company.trackingserver.repository;

import com.company.trackingserver.entity.ActivityEvent;
import com.company.trackingserver.dto.ActivityStatusSummary;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ActivityEventRepository
        extends JpaRepository<ActivityEvent, Long> {

    List<ActivityEvent> findByDeviceId(Long deviceId);

    List<ActivityEvent> findByDeviceIdAndStartedAtBetween(
            Long deviceId,
            LocalDateTime start,
            LocalDateTime end
    );

    @Query("""
            select a
            from ActivityEvent a
            where a.device.id = :deviceId
              and a.startedAt < :end
              and (a.endedAt is null or a.endedAt > :start)
            order by a.startedAt asc
            """)
    List<ActivityEvent> findOverlappingByDeviceId(
            @Param("deviceId") Long deviceId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    List<ActivityEvent> findByStatus(String status);

    boolean existsByDeviceIdAndAgentEventId(
            Long deviceId,
            Long agentEventId
    );

    @Query(value = """
            select
                status as status,
                cast(sum(extract(epoch from (ended_at - started_at))) as bigint) as totalSeconds
            from activity_event
            where device_id = :deviceId
              and started_at >= :start
              and started_at < :end
              and ended_at is not null
            group by status
            order by totalSeconds desc
            """, nativeQuery = true)
    List<ActivityStatusSummary> summarizeActivityStatus(
            @Param("deviceId") Long deviceId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
