package com.company.trackingserver.dto;

import java.time.LocalDateTime;

public record CategoryRuleResponse(
        Long id,
        Long categoryId,
        String categoryName,
        String matchType,
        String pattern,
        Integer priority,
        Boolean enabled,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
