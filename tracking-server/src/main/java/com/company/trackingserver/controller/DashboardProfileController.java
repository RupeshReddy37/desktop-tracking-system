package com.company.trackingserver.controller;

import com.company.trackingserver.dto.EmployeeProfileResponse;
import com.company.trackingserver.service.DashboardProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardProfileController {

    private final DashboardProfileService dashboardProfileService;

    @GetMapping("/employees/{employeeId}/profile")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public EmployeeProfileResponse getEmployeeProfile(@PathVariable Long employeeId) {

        return dashboardProfileService.getEmployeeProfile(employeeId);
    }
}
