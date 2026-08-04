package com.company.trackingagent.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.trackingagent.entity.AgentDeviceState;

public interface AgentDeviceStateRepository
        extends JpaRepository<AgentDeviceState, Integer> {
}
