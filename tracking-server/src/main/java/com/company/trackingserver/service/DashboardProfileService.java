package com.company.trackingserver.service;

import com.company.trackingserver.dto.EmployeeProfileResponse;
import com.company.trackingserver.entity.Device;
import com.company.trackingserver.entity.Employee;
import com.company.trackingserver.repository.DeviceRepository;
import com.company.trackingserver.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardProfileService {

    private final EmployeeRepository employeeRepository;
    private final DeviceRepository deviceRepository;

    public EmployeeProfileResponse getEmployeeProfile(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        Device device = deviceRepository.findFirstByEmployeeId(employeeId).orElse(null);

        return new EmployeeProfileResponse(
                employee.getId(),
                employee.getEmployeeCode(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getEmail(),
                employee.getActive(),
                device == null ? null : device.getId(),
                device == null ? null : device.getAgentDeviceId(),
                device == null ? null : device.getHostname(),
                device == null ? null : device.getOperatingSystem(),
                device == null ? null : device.getAgentVersion(),
                device == null ? null : device.getLastSeenAt(),
                employee.getCreatedAt(),
                employee.getUpdatedAt());
    }
}
