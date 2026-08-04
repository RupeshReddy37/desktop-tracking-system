package com.company.trackingserver.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeviceRegistrationResponse {

    private Long deviceId;

    private Long employeeId;

    private String employeeCode;

    private String hostname;

    private Boolean registered;

    private Boolean active;
}
