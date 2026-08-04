package com.company.trackingserver.dto;

public record EmployeeApplicationUsageResponse(
        String applicationName,
        String processName,
        Long activeSeconds,
        Long idleSeconds,
        Long trackedSeconds,
        Long employeeCount,
        Long dayCount) {
}
