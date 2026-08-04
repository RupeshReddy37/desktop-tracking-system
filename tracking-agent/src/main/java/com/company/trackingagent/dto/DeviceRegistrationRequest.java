package com.company.trackingagent.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeviceRegistrationRequest {

    private String employeeCode;

    private String agentDeviceId;

    private String hostname;

    private String operatingSystem;

    private String agentVersion;
}
