package com.company.trackingserver.security;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

import org.springframework.stereotype.Component;

/**
 * Generates cryptographically secure device credentials.
 *
 * <p>The Device ID is a random UUID (128 bits of entropy). The Device
 * Secret is 32 random bytes encoded as base64url (256 bits of entropy).
 * Neither value is derived from hostname, MAC address, employee code,
 * or any other identifier.
 */
@Component
public class DeviceCredentialGenerator {

    private static final int SECRET_BYTES = 32;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public String generateDeviceId() {
        return UUID.randomUUID().toString();
    }

    public String generateDeviceSecret() {
        byte[] bytes = new byte[SECRET_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
