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

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "activity_anomaly", indexes = {
        @Index(name = "idx_anomaly_employee_time", columnList = "employee_id, detected_at"),
        @Index(name = "idx_anomaly_review_status", columnList = "review_status"),
        @Index(name = "idx_anomaly_type_confidence", columnList = "anomaly_type, confidence")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_anomaly_input_summary_type", columnNames = {"input_summary_id", "anomaly_type"})
})
public class ActivityAnomaly {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "input_summary_id", nullable = false)
    private Long inputSummaryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "anomaly_type", nullable = false, length = 80)
    private String anomalyType;

    @Column(name = "confidence", nullable = false, length = 20)
    private String confidence;

    @Column(name = "reason_summary", nullable = false, length = 500)
    private String reasonSummary;

    @Column(name = "evidence_json", nullable = false, length = 2000)
    private String evidenceJson;

    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt;

    @Column(name = "bucket_started_at", nullable = false)
    private LocalDateTime bucketStartedAt;

    @Column(name = "bucket_ended_at", nullable = false)
    private LocalDateTime bucketEndedAt;

    @Column(name = "review_status", nullable = false, length = 30)
    private String reviewStatus;

    @Column(name = "reviewed_by", length = 100)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_comment", length = 1000)
    private String reviewComment;
}
