package com.company.trackingserver.repository;

import com.company.trackingserver.entity.ActivityAnomaly;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface ActivityAnomalyRepository extends JpaRepository<ActivityAnomaly, Long> {

    @Query("""
            select a
            from ActivityAnomaly a
            join a.employee e
            where a.detectedAt between :startDateTime and :endDateTime
              and (:employeeId is null or e.id = :employeeId)
              and (:employeeCode = '' or lower(e.employeeCode) = lower(:employeeCode))
              and (:email = '' or lower(e.email) like concat('%', lower(:email), '%'))
            """)
    Page<ActivityAnomaly> searchAnomalies(
            @Param("employeeId") Long employeeId,
            @Param("employeeCode") String employeeCode,
            @Param("email") String email,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime,
            Pageable pageable);
}
