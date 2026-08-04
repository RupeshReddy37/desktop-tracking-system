package com.company.trackingserver.dto;

import java.time.LocalDate;

public record EmployeeDailyWindowUsageResponse(
        Long employeeId,
        String employeeCode,
        String firstName,
        String lastName,
        String email,
        LocalDate usageDate,
        String applicationName,
        String processName,
        String windowTitle,
        String documentTitle,
        String fileName,
        Long activeSeconds,
        Long idleSeconds,
        Long trackedSeconds,
        String category) {
}
