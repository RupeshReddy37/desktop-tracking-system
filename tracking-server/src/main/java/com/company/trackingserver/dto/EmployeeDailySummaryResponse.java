package com.company.trackingserver.dto;

import java.time.LocalDate;

public record EmployeeDailySummaryResponse(
        Long employeeId,
        String employeeCode,
        String firstName,
        String lastName,
        String email,
        LocalDate usageDate,
        Long activeSeconds,
        Long idleSeconds,
        Long trackedSeconds) {
}
