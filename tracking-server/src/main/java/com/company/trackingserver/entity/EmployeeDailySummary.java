package com.company.trackingserver.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "employee_daily_summary", indexes = {
        @Index(name = "idx_employee_daily_summary_employee_date", columnList = "employee_id, usage_date"),
        @Index(name = "idx_employee_daily_summary_date_employee", columnList = "usage_date, employee_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_employee_daily_summary_employee_date", columnNames = {"employee_id", "usage_date"})
})
public class EmployeeDailySummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @Column(name = "active_seconds", nullable = false)
    private Long activeSeconds;

    @Column(name = "idle_seconds", nullable = false)
    private Long idleSeconds;

    @Column(name = "tracked_seconds", nullable = false)
    private Long trackedSeconds;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
