package com.company.trackingserver.dto;

import java.time.LocalDateTime;

public record EmployeeProfileResponse(
        Long employeeId,
        String employeeCode,
        String firstName,
        String lastName,
        String email,
        Boolean active,
        Long deviceId,
        String agentDeviceId,
        String hostname,
        String operatingSystem,
        String agentVersion,
        LocalDateTime lastSeenAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
