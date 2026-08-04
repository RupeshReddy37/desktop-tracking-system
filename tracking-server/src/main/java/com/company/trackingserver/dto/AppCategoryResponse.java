package com.company.trackingserver.dto;

import java.time.LocalDateTime;

public record AppCategoryResponse(
        Long id,
        String name,
        String color,
        Boolean productive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
