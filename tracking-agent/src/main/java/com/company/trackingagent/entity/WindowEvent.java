package com.company.trackingagent.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "window_event")
public class WindowEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "window_title", nullable = false)
    private String windowTitle;

    @Column(name = "process_name")
    private String processName;

    @Column(name = "application_name")
    private String applicationName;

    @Column(name = "document_title")
    private String documentTitle;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "last_observed_at")
    private LocalDateTime lastObservedAt;

    @Column(nullable = false)
    private boolean synced;

    @Column(name = "synced_at")
    private LocalDateTime syncedAt;

    @Column(nullable = false)
    private boolean recovered;
}
