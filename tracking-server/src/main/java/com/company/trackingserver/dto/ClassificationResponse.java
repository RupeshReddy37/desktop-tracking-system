package com.company.trackingserver.dto;

public record ClassificationResponse(
        Long categoryId,
        String categoryName,
        Boolean productive,
        String matchType,
        String matchedPattern) {
}
