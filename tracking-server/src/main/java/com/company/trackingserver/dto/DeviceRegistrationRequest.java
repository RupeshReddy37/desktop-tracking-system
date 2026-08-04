package com.company.trackingserver.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeviceRegistrationRequest {

    @NotBlank
    private String employeeCode;

    @NotBlank
    private String agentDeviceId;

    @NotBlank
    private String hostname;

    @NotBlank
    private String operatingSystem;

    @NotBlank
    private String agentVersion;
}
