package com.company.trackingserver.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "activity_event", indexes = {
        @Index(name = "idx_activity_device", columnList = "device_id"),
        @Index(name = "idx_activity_started", columnList = "started_at"),
        @Index(name = "idx_activity_ended", columnList = "ended_at"),
        @Index(name = "idx_activity_status", columnList = "status"),
        @Index(name = "idx_activity_device_started", columnList = "device_id, started_at")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_activity_event_device_agent_event", columnNames = {"device_id", "agent_event_id"})
})
public class ActivityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Column(name = "agent_event_id")
    private Long agentEventId;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private Boolean recovered;
}
