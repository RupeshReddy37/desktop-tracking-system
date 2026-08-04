package com.company.trackingagent.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "activity_event")
@Getter
@Setter
public class ActivityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String status;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "last_observed_at")
    private LocalDateTime lastObservedAt;

    @Column(nullable = false)
    private boolean synced = false;

    @Column(name = "synced_at")
    private LocalDateTime syncedAt;

    @Column(nullable = false)
    private boolean recovered;
}
