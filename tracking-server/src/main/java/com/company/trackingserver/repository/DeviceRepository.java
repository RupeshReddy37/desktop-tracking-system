package com.company.trackingserver.repository;

import com.company.trackingserver.dto.EmployeeDashboardSummary;
import com.company.trackingserver.dto.EmployeeStatusSummary;
import com.company.trackingserver.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DeviceRepository
        extends JpaRepository<Device, Long> {

    Optional<Device> findByHostname(String hostname);

    Optional<Device> findByAgentDeviceId(String agentDeviceId);

    List<Device> findByEmployeeId(Long employeeId);

    Optional<Device> findFirstByEmployeeId(Long employeeId);

    boolean existsByHostname(String hostname);

    boolean existsByAgentDeviceId(String agentDeviceId);

    @Query(value = """
            select
                e.id as employeeId,
                e.employee_code as employeeCode,
                e.first_name as firstName,
                e.last_name as lastName,
                e.email as email,
                d.id as deviceId,
                d.hostname as hostname,
                case
                    when d.id is null then 'NOT_REGISTERED'
                    when d.last_seen_at is null or d.last_seen_at < :offlineBefore then 'OFFLINE'
                    else coalesce(latest_activity.status, 'UNKNOWN')
                end as currentStatus,
                case
                    when d.id is null then null
                    when d.last_seen_at is null or d.last_seen_at < :offlineBefore then d.last_seen_at
                    else latest_activity.started_at
                end as statusSinceAt,
                d.last_seen_at as lastSeenAt,
                cast(coalesce(sum(case when ae.status = 'ACTIVE' then
                    extract(epoch from (least(ae.ended_at, :endTime) - greatest(ae.started_at, :startTime)))
                    else 0 end), 0) as bigint) as activeSecondsToday,
                cast(coalesce(sum(case when ae.status = 'IDLE' then
                    extract(epoch from (least(ae.ended_at, :endTime) - greatest(ae.started_at, :startTime)))
                    else 0 end), 0) as bigint) as idleSecondsToday,
                cast(coalesce(sum(case when ae.status = 'LOCKED' then
                    extract(epoch from (least(ae.ended_at, :endTime) - greatest(ae.started_at, :startTime)))
                    else 0 end), 0) as bigint) as lockedSecondsToday,
                cast(coalesce(sum(case when ae.status = 'OFFLINE' then
                    extract(epoch from (least(ae.ended_at, :endTime) - greatest(ae.started_at, :startTime)))
                    else 0 end), 0) as bigint) as offlineSecondsToday
            from employee e
            left join device d on d.employee_id = e.id
            left join lateral (
                select a.status, a.started_at
                from activity_event a
                where a.device_id = d.id
                order by a.started_at desc
                limit 1
            ) latest_activity on true
            left join activity_event ae
              on ae.device_id = d.id
             and ae.ended_at is not null
             and ae.started_at < :endTime
             and ae.ended_at > :startTime
            where (:employeeId is null or e.id = :employeeId)
              and (:employeeCode is null or lower(e.employee_code) = lower(:employeeCode))
              and (:email is null or lower(e.email) like concat('%', lower(:email), '%'))
            group by
                e.id,
                e.employee_code,
                e.first_name,
                e.last_name,
                e.email,
                d.id,
                d.hostname,
                d.last_seen_at,
                latest_activity.status,
                latest_activity.started_at
            order by e.id, d.id
            limit :limit offset :offset
            """, nativeQuery = true)
    List<EmployeeStatusSummary> summarizeEmployeeStatus(
            @Param("employeeId") Long employeeId,
            @Param("employeeCode") String employeeCode,
            @Param("email") String email,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("offlineBefore") LocalDateTime offlineBefore,
            @Param("limit") int limit,
            @Param("offset") long offset);

    @Query(value = """
            select
                e.id as employeeId,
                e.employee_code as employeeCode,
                e.first_name as firstName,
                e.last_name as lastName,
                e.email as email,
                case
                    when d.id is null then 'NOT_REGISTERED'
                    when d.last_seen_at is null or d.last_seen_at < :offlineBefore then 'OFFLINE'
                    else coalesce(latest_activity.status, 'UNKNOWN')
                end as currentStatus,
                case
                    when d.id is null then null
                    when d.last_seen_at is null or d.last_seen_at < :offlineBefore then d.last_seen_at
                    else latest_activity.started_at
                end as statusSinceAt,
                d.last_seen_at as lastSeenAt,
                cast(coalesce(sum(case when ae.status = 'ACTIVE' then
                    extract(epoch from (least(ae.ended_at, :endTime) - greatest(ae.started_at, :startTime)))
                    else 0 end), 0) as bigint) as activeSecondsToday,
                cast(coalesce(sum(case when ae.status = 'IDLE' then
                    extract(epoch from (least(ae.ended_at, :endTime) - greatest(ae.started_at, :startTime)))
                    else 0 end), 0) as bigint) as idleSecondsToday,
                cast(coalesce(sum(case when ae.status = 'LOCKED' then
                    extract(epoch from (least(ae.ended_at, :endTime) - greatest(ae.started_at, :startTime)))
                    else 0 end), 0) as bigint) as lockedSecondsToday,
                cast(coalesce(sum(case when ae.status = 'OFFLINE' then
                    extract(epoch from (least(ae.ended_at, :endTime) - greatest(ae.started_at, :startTime)))
                    else 0 end), 0) as bigint) as offlineSecondsToday
            from employee e
            left join device d on d.employee_id = e.id
            left join lateral (
                select a.status, a.started_at
                from activity_event a
                where a.device_id = d.id
                order by a.started_at desc
                limit 1
            ) latest_activity on true
            left join activity_event ae
              on ae.device_id = d.id
             and ae.ended_at is not null
             and ae.started_at < :endTime
             and ae.ended_at > :startTime
            where (:employeeId is null or e.id = :employeeId)
              and (:employeeCode is null or lower(e.employee_code) = lower(:employeeCode))
              and (:email is null or lower(e.email) like concat('%', lower(:email), '%'))
            group by
                e.id,
                e.employee_code,
                e.first_name,
                e.last_name,
                e.email,
                d.last_seen_at,
                latest_activity.status,
                latest_activity.started_at,
                d.id
            order by e.id
            """, nativeQuery = true)
    List<EmployeeDashboardSummary> summarizeEmployeeDashboard(
            @Param("employeeId") Long employeeId,
            @Param("employeeCode") String employeeCode,
            @Param("email") String email,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("offlineBefore") LocalDateTime offlineBefore);
}
