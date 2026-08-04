package com.company.trackingserver.entity;

import java.time.LocalDateTime;

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

@Getter
@Setter
@Entity
@Table(name = "system_event", indexes = {
        @Index(name = "idx_system_event_device_observed", columnList = "device_id, observed_at"),
        @Index(name = "idx_system_event_type", columnList = "type")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_system_event_device_agent_event", columnNames = {"device_id", "agent_event_id"})
})
public class SystemEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Column(name = "agent_event_id", nullable = false)
    private Long agentEventId;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(name = "observed_at", nullable = false)
    private LocalDateTime observedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
