package com.company.trackingserver.security;

import com.company.trackingserver.entity.Device;

/**
 * Represents an authenticated tracking agent device within the
 * Spring Security context.
 */
public record DevicePrincipal(
        Long deviceId,
        String deviceIdPublic,
        Long employeeId) {

    public static DevicePrincipal from(Device device) {
        return new DevicePrincipal(
                device.getId(),
                device.getDeviceId(),
                device.getEmployee().getId());
    }
}
