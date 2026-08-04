package com.company.trackingserver.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CategoryRuleRequest(
        @NotNull Long categoryId,
        @NotBlank @Size(max = 20) String matchType,
        @NotBlank @Size(max = 255) String pattern,
        Integer priority,
        Boolean enabled) {
}
