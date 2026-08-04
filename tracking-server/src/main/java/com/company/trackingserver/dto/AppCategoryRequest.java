package com.company.trackingserver.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AppCategoryRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 20) String color,
        @NotNull Boolean productive) {
}
