package com.company.trackingagent.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "agent_device_state")
public class AgentDeviceState {

    public static final Integer SINGLETON_ID = 1;

    @Id
    private Integer id;

    @Column(name = "agent_device_id", nullable = false, unique = true, length = 100)
    private String agentDeviceId;

    @Column(name = "server_device_id")
    private Long serverDeviceId;

    @Column(name = "registered_at")
    private LocalDateTime registeredAt;

    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
