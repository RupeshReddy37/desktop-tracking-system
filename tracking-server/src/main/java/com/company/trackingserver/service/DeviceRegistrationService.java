package com.company.trackingserver.service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.trackingserver.dto.DeviceRegistrationRequest;
import com.company.trackingserver.dto.DeviceRegistrationResponse;
import com.company.trackingserver.entity.Device;
import com.company.trackingserver.entity.Employee;
import com.company.trackingserver.model.DeviceStatus;
import com.company.trackingserver.repository.DeviceRepository;
import com.company.trackingserver.repository.EmployeeRepository;
import com.company.trackingserver.security.DeviceCredentialGenerator;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceRegistrationService {

    private final EmployeeRepository employeeRepository;
    private final DeviceRepository deviceRepository;
    private final DeviceCredentialGenerator credentialGenerator;
    private final PasswordEncoder passwordEncoder;

    /**
     * Registers a tracking agent device and returns a freshly generated
     * cryptographic Device ID + Device Secret. The secret is returned in
     * plaintext exactly once; only its BCrypt hash is persisted.
     */
    @Transactional
    public DeviceRegistrationResponse registerDevice(
            DeviceRegistrationRequest request) {

        String employeeCode = request.getEmployeeCode().trim();
        String agentDeviceId = request.getAgentDeviceId().trim();
        String hostname = request.getHostname().trim();
        String operatingSystem = request.getOperatingSystem().trim();
        String agentVersion = request.getAgentVersion().trim();

        Employee employee = employeeRepository
                .findByEmployeeCode(employeeCode)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Employee code not found"));

        if (!Boolean.TRUE.equals(employee.getActive())) {
            throw new IllegalArgumentException(
                    "Employee is not active");
        }

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        // Generate fresh cryptographic credentials for this registration.
        String deviceId = credentialGenerator.generateDeviceId();
        String deviceSecret = credentialGenerator.generateDeviceSecret();
        String secretHash = passwordEncoder.encode(deviceSecret);

        Device device = deviceRepository
                .findFirstByEmployeeId(employee.getId())
                .map(existing -> rotateExistingDevice(
                        existing,
                        employee,
                        agentDeviceId,
                        hostname,
                        operatingSystem,
                        agentVersion,
                        deviceId,
                        secretHash,
                        now))
                .orElseGet(() -> createDevice(
                        employee,
                        agentDeviceId,
                        hostname,
                        operatingSystem,
                        agentVersion,
                        deviceId,
                        secretHash,
                        now));

        Device savedDevice = deviceRepository.save(device);

        log.info("Agent device registered: deviceId={} employeeId={} active={}",
                savedDevice.getId(),
                savedDevice.getEmployee().getId(),
                savedDevice.getActive());

        return toRegistrationResponse(savedDevice, deviceSecret);
    }

    private Device rotateExistingDevice(
            Device device,
            Employee employee,
            String agentDeviceId,
            String hostname,
            String operatingSystem,
            String agentVersion,
            String deviceId,
            String secretHash,
            LocalDateTime now) {

        if (!device.getEmployee().getId().equals(employee.getId())) {
            throw new IllegalArgumentException(
                    "Agent device is already linked to a different employee");
        }

        device.setAgentDeviceId(agentDeviceId);
        device.setDeviceId(deviceId);
        device.setSecretHash(secretHash);
        device.setStatus(DeviceStatus.ACTIVE.name());
        device.setHostname(hostname);
        device.setOperatingSystem(operatingSystem);
        device.setAgentVersion(agentVersion);
        device.setActive(true);
        device.setLastSeenAt(now);
        device.setSecretRotatedAt(now);
        device.setSecretVersion(
                device.getSecretVersion() == null ? 1 : device.getSecretVersion() + 1);
        device.setUpdatedAt(now);

        return device;
    }

    private Device createDevice(
            Employee employee,
            String agentDeviceId,
            String hostname,
            String operatingSystem,
            String agentVersion,
            String deviceId,
            String secretHash,
            LocalDateTime now) {

        Device device = new Device();

        device.setEmployee(employee);
        device.setAgentDeviceId(agentDeviceId);
        device.setDeviceId(deviceId);
        device.setSecretHash(secretHash);
        device.setStatus(DeviceStatus.ACTIVE.name());
        device.setHostname(hostname);
        device.setOperatingSystem(operatingSystem);
        device.setAgentVersion(agentVersion);
        device.setActive(true);
        device.setLastSeenAt(now);
        device.setSecretVersion(1);
        device.setCreatedAt(now);
        device.setUpdatedAt(now);

        return device;
    }

    private DeviceRegistrationResponse toRegistrationResponse(
            Device device,
            String plaintextSecret) {

        DeviceRegistrationResponse response = new DeviceRegistrationResponse();

        response.setDeviceId(device.getId());
        response.setDeviceIdPublic(device.getDeviceId());
        response.setDeviceSecret(plaintextSecret);
        response.setEmployeeId(device.getEmployee().getId());
        response.setEmployeeCode(
                device.getEmployee().getEmployeeCode());
        response.setHostname(device.getHostname());
        response.setRegistered(true);
        response.setActive(device.getActive());

        return response;
    }
}
