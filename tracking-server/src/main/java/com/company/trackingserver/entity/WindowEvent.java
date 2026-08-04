package com.company.trackingserver.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "window_event", indexes = {
                @Index(name = "idx_window_device", columnList = "device_id"),
                @Index(name = "idx_window_started", columnList = "started_at"),
                @Index(name = "idx_window_ended", columnList = "ended_at"),
                @Index(name = "idx_window_device_started", columnList = "device_id, started_at")
}, uniqueConstraints = {
                @UniqueConstraint(name = "uq_window_event_device_agent_event", columnNames = { "device_id",
                                "agent_event_id" })
})
public class WindowEvent {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "device_id", nullable = false)
        private Device device;

        @Column(name = "agent_event_id")
        private Long agentEventId;

        @Column(name = "window_title", nullable = false, length = 500)
        private String windowTitle;

        @Column(name = "process_name", length = 255)
        private String processName;

        @Column(name = "application_name", length = 255)
        private String applicationName;

        @Column(name = "document_title", length = 500)
        private String documentTitle;

        @Column(name = "started_at", nullable = false)
        private LocalDateTime startedAt;

        @Column(name = "ended_at")
        private LocalDateTime endedAt;

        @Column(name = "created_at", nullable = false)
        private LocalDateTime createdAt;

        @Column(nullable = false)
        private Boolean recovered;
}
