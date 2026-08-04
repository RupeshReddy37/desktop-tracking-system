package com.company.trackingserver.dto;

import java.time.LocalDateTime;

public record EmployeeDashboardRow(
        Long employeeId,
        String employeeCode,
        String firstName,
        String lastName,
        String email,
        String currentStatus,
        LocalDateTime statusSinceAt,
        LocalDateTime lastSeenAt,
        Long activeSecondsToday,
        Long idleSecondsToday,
        Long lockedSecondsToday,
        Long offlineSecondsToday) {
}
