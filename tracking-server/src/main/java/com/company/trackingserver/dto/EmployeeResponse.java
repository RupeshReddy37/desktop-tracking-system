package com.company.trackingserver.dto;

import java.time.LocalDateTime;

public record EmployeeResponse(
        Long id,
        String employeeCode,
        String firstName,
        String lastName,
        String email,
        Boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
