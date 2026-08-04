package com.company.trackingserver.controller;

import com.company.trackingserver.dto.EmployeeApplicationUsageResponse;
import com.company.trackingserver.dto.EmployeeDailySummaryResponse;
import com.company.trackingserver.dto.EmployeeDailyWindowUsageResponse;
import com.company.trackingserver.service.EmployeeReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class DailyReportController {


    private final EmployeeReportService employeeReportService;

    @GetMapping("/daily-summary")
    public List<EmployeeDailySummaryResponse> getDailySummary(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String employeeCode,
            @RequestParam(required = false) String email,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        return employeeReportService.getDailySummary(
                employeeId,
                employeeCode,
                email,
                startDate,
                endDate);
    }

    @GetMapping("/daily-window-usage")
    public List<EmployeeDailyWindowUsageResponse> getDailyWindowUsage(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String employeeCode,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String applicationName,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        return employeeReportService.getDailyWindowUsage(
                employeeId,
                employeeCode,
                email,
                applicationName,
                startDate,
                endDate);
    }

    @GetMapping("/application-usage")
    public List<EmployeeApplicationUsageResponse> getApplicationUsage(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String employeeCode,
            @RequestParam(required = false) String email,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        return employeeReportService.getApplicationUsage(
                employeeId,
                employeeCode,
                email,
                startDate,
                endDate);
    }
}
