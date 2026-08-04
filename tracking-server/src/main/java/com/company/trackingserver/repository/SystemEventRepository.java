package com.company.trackingserver.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.trackingserver.entity.SystemEvent;

public interface SystemEventRepository extends JpaRepository<SystemEvent, Long> {

    boolean existsByDeviceIdAndAgentEventId(
            Long deviceId,
            Long agentEventId);
}
