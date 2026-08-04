package com.company.trackingserver.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.trackingserver.dto.DeviceRegistrationRequest;
import com.company.trackingserver.dto.DeviceRegistrationResponse;
import com.company.trackingserver.service.DeviceRegistrationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/devices")
@RequiredArgsConstructor
public class DeviceRegistrationController {

    private final DeviceRegistrationService deviceRegistrationService;

    @PostMapping("/register")
    public DeviceRegistrationResponse registerDevice(
            @Valid @RequestBody DeviceRegistrationRequest request) {

        return deviceRegistrationService.registerDevice(request);
    }
}
