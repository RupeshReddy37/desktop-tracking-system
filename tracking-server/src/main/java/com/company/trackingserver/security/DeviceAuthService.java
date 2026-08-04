package com.company.trackingserver.security;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.trackingserver.entity.Device;
import com.company.trackingserver.model.DeviceStatus;
import com.company.trackingserver.repository.DeviceRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Authenticates a tracking agent device using its cryptographic
 * Device ID + Device Secret. The secret is verified against a BCrypt
 * hash using Spring Security's constant-time comparison.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceAuthService {

    private final DeviceRepository deviceRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Authenticates a device by its Device ID and plaintext secret.
     *
     * @return the authenticated device, or {@code null} if credentials are invalid
     */
    @Transactional
    public Device authenticate(String deviceId, String deviceSecret) {

        if (deviceId == null || deviceId.isBlank()
                || deviceSecret == null || deviceSecret.isBlank()) {
            return null;
        }

        Device device = deviceRepository.findByDeviceId(deviceId.trim())
                .orElse(null);

        if (device == null) {
            // Perform a dummy comparison to reduce timing differences
            // between "unknown device" and "wrong secret" responses.
            passwordEncoder.matches(deviceSecret, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidin");
            return null;
        }

        if (!passwordEncoder.matches(deviceSecret, device.getSecretHash())) {
            log.warn("Device authentication failed: deviceId={}", deviceId);
            return null;
        }

        if (!DeviceStatus.ACTIVE.name().equals(device.getStatus())) {
            log.warn("Device authentication rejected (not active): deviceId={} status={}",
                    deviceId, device.getStatus());
            return null;
        }

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        device.setLastAuthAt(now);
        device.setLastSeenAt(now);
        device.setUpdatedAt(now);
        deviceRepository.save(device);

        return device;
    }
}
