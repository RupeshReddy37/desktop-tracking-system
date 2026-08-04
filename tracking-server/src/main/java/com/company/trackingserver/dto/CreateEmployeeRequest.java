package com.company.trackingserver.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateEmployeeRequest(
        @NotBlank String employeeCode,
        @NotBlank String firstName,
        String lastName,
        @Email @NotBlank String email) {
}
