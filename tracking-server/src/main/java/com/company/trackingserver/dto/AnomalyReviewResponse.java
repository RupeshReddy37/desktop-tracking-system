package com.company.trackingserver.dto;

import java.time.LocalDateTime;

public record AnomalyReviewResponse(
        Long employeeId,
        String employeeCode,
        String firstName,
        String lastName,
        String email,
        LocalDateTime detectedAt,
        String anomalyType,
        String confidence,
        String reasonSummary,
        String reviewStatus) {
}
