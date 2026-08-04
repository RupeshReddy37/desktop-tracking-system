package com.company.trackingserver.repository;

import com.company.trackingserver.entity.EmployeeDailyWindowUsage;
import com.company.trackingserver.dto.EmployeeApplicationUsageSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface EmployeeDailyWindowUsageRepository extends JpaRepository<EmployeeDailyWindowUsage, Long> {

    void deleteByUsageDate(LocalDate usageDate);

    @Query("""
            select w
            from EmployeeDailyWindowUsage w
            join fetch w.employee e
            where w.usageDate between :startDate and :endDate
              and (:employeeId is null or e.id = :employeeId)
              and (:employeeCode = '' or lower(e.employeeCode) = lower(:employeeCode))
              and (:email = '' or lower(e.email) like concat('%', lower(:email), '%'))
              and (:applicationName = '' or lower(w.applicationName) like concat('%', lower(:applicationName), '%'))
            order by w.usageDate asc, e.id asc, w.applicationName asc, w.windowTitle asc
            """)
    List<EmployeeDailyWindowUsage> searchDailyWindowUsage(
            @Param("employeeId") Long employeeId,
            @Param("employeeCode") String employeeCode,
            @Param("email") String email,
            @Param("applicationName") String applicationName,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query(value = """
            select
                coalesce(w.application_name, 'Unknown') as applicationName,
                coalesce(w.process_name, '') as processName,
                cast(coalesce(sum(w.active_seconds), 0) as bigint) as activeSeconds,
                cast(coalesce(sum(w.idle_seconds), 0) as bigint) as idleSeconds,
                cast(coalesce(sum(w.tracked_seconds), 0) as bigint) as trackedSeconds,
                cast(count(distinct w.employee_id) as bigint) as employeeCount,
                cast(count(distinct w.usage_date) as bigint) as dayCount
            from employee_daily_window_usage w
            join employee e on e.id = w.employee_id
            where w.usage_date between :startDate and :endDate
              and (:employeeId is null or e.id = :employeeId)
              and (:employeeCode = '' or lower(e.employee_code) = lower(:employeeCode))
              and (:email = '' or lower(e.email) like concat('%', lower(:email), '%'))
            group by coalesce(w.application_name, 'Unknown'), coalesce(w.process_name, '')
            order by trackedSeconds desc, applicationName asc, processName asc
            """, nativeQuery = true)
    List<EmployeeApplicationUsageSummary> summarizeApplicationUsage(
            @Param("employeeId") Long employeeId,
            @Param("employeeCode") String employeeCode,
            @Param("email") String email,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
