package com.company.trackingserver.service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.trackingserver.dto.CreateEmployeeRequest;
import com.company.trackingserver.dto.EmployeeResponse;
import com.company.trackingserver.entity.Employee;
import com.company.trackingserver.repository.EmployeeRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getEmployees() {
        return employeeRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public EmployeeResponse createEmployee(CreateEmployeeRequest request) {
        if (employeeRepository.existsByEmployeeCode(request.employeeCode())) {
            throw new IllegalArgumentException("Employee code already exists");
        }

        if (employeeRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Employee email already exists");
        }

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        Employee employee = new Employee();
        employee.setEmployeeCode(request.employeeCode().trim());
        employee.setFirstName(request.firstName().trim());
        employee.setLastName(request.lastName() == null ? null : request.lastName().trim());
        employee.setEmail(request.email().trim());
        employee.setActive(true);
        employee.setCreatedAt(now);
        employee.setUpdatedAt(now);

        employee = employeeRepository.save(employee);

        return toResponse(employee);
    }

    private EmployeeResponse toResponse(Employee employee) {
        return new EmployeeResponse(
            employee.getId(),
            employee.getEmployeeCode(),
            employee.getFirstName(),
            employee.getLastName(),
            employee.getEmail(),
            employee.getActive(),
            employee.getCreatedAt(),
            employee.getUpdatedAt());
    }
}
