package com.company.trackingserver.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "device", indexes = {
        @Index(name = "idx_device_employee", columnList = "employee_id"),
        @Index(name = "idx_device_hostname", columnList = "hostname"),
        @Index(name = "idx_device_status", columnList = "status")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_device_agent_device_id", columnNames = "agent_device_id"),
        @UniqueConstraint(name = "uq_device_employee", columnNames = "employee_id"),
        @UniqueConstraint(name = "uq_device_device_id", columnNames = "device_id")
})
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "agent_device_id", length = 100)
    private String agentDeviceId;

    @Column(name = "device_id", nullable = false, unique = true, length = 64)
    private String deviceId;

    @Column(name = "secret_hash", nullable = false, length = 255)
    private String secretHash;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "hostname", nullable = false, length = 255)
    private String hostname;

    @Column(name = "operating_system", nullable = false, length = 100)
    private String operatingSystem;

    @Column(name = "agent_version", nullable = false, length = 50)
    private String agentVersion;

    @Column(nullable = false)
    private Boolean active;

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    @Column(name = "last_auth_at")
    private LocalDateTime lastAuthAt;

    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    @Column(name = "secret_rotated_at")
    private LocalDateTime secretRotatedAt;

    @Column(name = "secret_version", nullable = false)
    private Integer secretVersion;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}


