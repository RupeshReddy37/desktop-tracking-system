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
@Table(name = "employee_daily_window_usage", indexes = {
        @Index(name = "idx_employee_daily_window_employee_date", columnList = "employee_id, usage_date"),
        @Index(name = "idx_employee_daily_window_date_app", columnList = "usage_date, application_name"),
        @Index(name = "idx_employee_daily_window_employee_app", columnList = "employee_id, usage_date, application_name")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_employee_daily_window_detail", columnNames = {"employee_id", "usage_date", "detail_key"})
})
public class EmployeeDailyWindowUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @Column(name = "detail_key", nullable = false, length = 32)
    private String detailKey;

    @Column(name = "application_name", nullable = false, length = 255)
    private String applicationName;

    @Column(name = "process_name", length = 255)
    private String processName;

    @Column(name = "window_title", nullable = false, length = 500)
    private String windowTitle;

    @Column(name = "document_title", length = 500)
    private String documentTitle;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "active_seconds", nullable = false)
    private Long activeSeconds;

    @Column(name = "idle_seconds", nullable = false)
    private Long idleSeconds;

    @Column(name = "tracked_seconds", nullable = false)
    private Long trackedSeconds;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
