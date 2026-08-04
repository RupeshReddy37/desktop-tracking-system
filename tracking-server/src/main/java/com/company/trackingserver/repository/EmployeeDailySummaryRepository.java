package com.company.trackingserver.repository;

import com.company.trackingserver.entity.EmployeeDailySummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface EmployeeDailySummaryRepository extends JpaRepository<EmployeeDailySummary, Long> {

    void deleteByUsageDate(LocalDate usageDate);

    @Query("""
            select s
            from EmployeeDailySummary s
            join fetch s.employee e
            where s.usageDate between :startDate and :endDate
              and (:employeeId is null or e.id = :employeeId)
              and (:employeeCode = '' or lower(e.employeeCode) = lower(:employeeCode))
              and (:email = '' or lower(e.email) like concat('%', lower(:email), '%'))
            order by s.usageDate asc, e.id asc
            """)
    List<EmployeeDailySummary> searchDailySummary(
            @Param("employeeId") Long employeeId,
            @Param("employeeCode") String employeeCode,
            @Param("email") String email,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
