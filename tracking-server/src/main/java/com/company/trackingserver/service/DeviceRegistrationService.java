package com.company.trackingserver.service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.trackingserver.dto.DeviceRegistrationRequest;
import com.company.trackingserver.dto.DeviceRegistrationResponse;
import com.company.trackingserver.entity.Device;
import com.company.trackingserver.entity.Employee;
import com.company.trackingserver.repository.DeviceRepository;
import com.company.trackingserver.repository.EmployeeRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceRegistrationService {

        private final EmployeeRepository employeeRepository;
        private final DeviceRepository deviceRepository;

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

                Device device = deviceRepository
                                .findFirstByEmployeeId(employee.getId())
                                .map(existingDevice -> updateExistingDevice(
                                                existingDevice,
                                                employee,
                                                agentDeviceId,
                                                hostname,
                                                operatingSystem,
                                                agentVersion,
                                                now))
                                .orElseGet(() -> deviceRepository
                                                .findByAgentDeviceId(agentDeviceId)
                                                .map(existingDevice -> updateExistingDevice(
                                                                existingDevice,
                                                                employee,
                                                                agentDeviceId,
                                                                hostname,
                                                                operatingSystem,
                                                                agentVersion,
                                                                now))
                                                .orElseGet(() -> createDevice(
                                                                employee,
                                                                agentDeviceId,
                                                                hostname,
                                                                operatingSystem,
                                                                agentVersion,
                                                                now)));

                Device savedDevice = deviceRepository.save(device);

                log.info("Agent device registered: deviceId={} employeeId={} active={}",
                                savedDevice.getId(),
                                savedDevice.getEmployee().getId(),
                                savedDevice.getActive());

                return toRegistrationResponse(savedDevice);
        }

        private Device updateExistingDevice(
                        Device device,
                        Employee employee,
                        String agentDeviceId,
                        String hostname,
                        String operatingSystem,
                        String agentVersion,
                        LocalDateTime now) {

                if (!device.getEmployee().getId().equals(employee.getId())) {
                        throw new IllegalArgumentException(
                                        "Agent device is already linked to a different employee");
                }

                device.setAgentDeviceId(agentDeviceId);
                device.setHostname(hostname);
                device.setOperatingSystem(operatingSystem);
                device.setAgentVersion(agentVersion);
                device.setActive(true);
                device.setLastSeenAt(now);
                device.setUpdatedAt(now);

                return device;
        }

        private Device createDevice(
                        Employee employee,
                        String agentDeviceId,
                        String hostname,
                        String operatingSystem,
                        String agentVersion,
                        LocalDateTime now) {

                Device device = new Device();

                device.setEmployee(employee);
                device.setAgentDeviceId(agentDeviceId);
                device.setHostname(hostname);
                device.setOperatingSystem(operatingSystem);
                device.setAgentVersion(agentVersion);
                device.setActive(true);
                device.setLastSeenAt(now);
                device.setCreatedAt(now);
                device.setUpdatedAt(now);

                return device;
        }

        private DeviceRegistrationResponse toRegistrationResponse(
                        Device device) {

                DeviceRegistrationResponse response = new DeviceRegistrationResponse();

                response.setDeviceId(device.getId());
                response.setEmployeeId(device.getEmployee().getId());
                response.setEmployeeCode(
                                device.getEmployee().getEmployeeCode());
                response.setHostname(device.getHostname());
                response.setRegistered(true);
                response.setActive(device.getActive());

                return response;
        }
}
