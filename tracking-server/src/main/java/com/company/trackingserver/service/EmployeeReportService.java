package com.company.trackingserver.service;

import com.company.trackingserver.dto.EmployeeApplicationUsageResponse;
import com.company.trackingserver.dto.EmployeeDailySummaryResponse;
import com.company.trackingserver.dto.EmployeeDailyWindowUsageResponse;
import com.company.trackingserver.entity.EmployeeDailySummary;
import com.company.trackingserver.entity.EmployeeDailyWindowUsage;
import com.company.trackingserver.repository.EmployeeDailySummaryRepository;
import com.company.trackingserver.repository.EmployeeDailyWindowUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeReportService {

    private final EmployeeDailySummaryRepository employeeDailySummaryRepository;
    private final EmployeeDailyWindowUsageRepository employeeDailyWindowUsageRepository;

    public List<EmployeeDailySummaryResponse> getDailySummary(
            Long employeeId,
            String employeeCode,
            String email,
            LocalDate startDate,
            LocalDate endDate) {

        return employeeDailySummaryRepository.searchDailySummary(
                employeeId,
                blankToEmpty(employeeCode),
                blankToEmpty(email),
                startDate,
                endDate)
                .stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    public List<EmployeeDailyWindowUsageResponse> getDailyWindowUsage(
            Long employeeId,
            String employeeCode,
            String email,
            String applicationName,
            LocalDate startDate,
            LocalDate endDate) {

        return employeeDailyWindowUsageRepository.searchDailyWindowUsage(
                employeeId,
                blankToEmpty(employeeCode),
                blankToEmpty(email),
                blankToEmpty(applicationName),
                startDate,
                endDate)
                .stream()
                .map(this::toWindowResponse)
                .toList();
    }

    public List<EmployeeApplicationUsageResponse> getApplicationUsage(
            Long employeeId,
            String employeeCode,
            String email,
            LocalDate startDate,
            LocalDate endDate) {

        return employeeDailyWindowUsageRepository.summarizeApplicationUsage(
                employeeId,
                blankToEmpty(employeeCode),
                blankToEmpty(email),
                startDate,
                endDate)
                .stream()
                .map(row -> new EmployeeApplicationUsageResponse(
                        blankToDefault(row.getApplicationName(), "Unknown"),
                        blankToEmpty(row.getProcessName()),
                        row.getActiveSeconds() == null ? 0L : row.getActiveSeconds(),
                        row.getIdleSeconds() == null ? 0L : row.getIdleSeconds(),
                        row.getTrackedSeconds() == null ? 0L : row.getTrackedSeconds(),
                        row.getEmployeeCount() == null ? 0L : row.getEmployeeCount(),
                        row.getDayCount() == null ? 0L : row.getDayCount()))
                .toList();
    }

    private EmployeeDailySummaryResponse toSummaryResponse(EmployeeDailySummary summary) {
        return new EmployeeDailySummaryResponse(
                summary.getEmployee().getId(),
                summary.getEmployee().getEmployeeCode(),
                summary.getEmployee().getFirstName(),
                summary.getEmployee().getLastName(),
                summary.getEmployee().getEmail(),
                summary.getUsageDate(),
                safeLong(summary.getActiveSeconds()),
                safeLong(summary.getIdleSeconds()),
                safeLong(summary.getTrackedSeconds()));
    }

    private EmployeeDailyWindowUsageResponse toWindowResponse(EmployeeDailyWindowUsage usage) {
        return new EmployeeDailyWindowUsageResponse(
                usage.getEmployee().getId(),
                usage.getEmployee().getEmployeeCode(),
                usage.getEmployee().getFirstName(),
                usage.getEmployee().getLastName(),
                usage.getEmployee().getEmail(),
                usage.getUsageDate(),
                blankToDefault(usage.getApplicationName(), "Unknown"),
                blankToEmpty(usage.getProcessName()),
                blankToEmpty(usage.getWindowTitle()),
                blankToEmpty(usage.getDocumentTitle()),
                blankToEmpty(usage.getFileName()),
                safeLong(usage.getActiveSeconds()),
                safeLong(usage.getIdleSeconds()),
                safeLong(usage.getTrackedSeconds()));
    }

    private long safeLong(Long value) {
        return value == null ? 0L : value;
    }

    private String blankToEmpty(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }

    private String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
