package com.company.trackingserver.controller;

import com.company.trackingserver.dto.AnomalyReviewResponse;
import com.company.trackingserver.service.AnomalyReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AnomalyReviewController {


    private final AnomalyReviewService anomalyReviewService;

    @GetMapping("/anomalies")
    public List<AnomalyReviewResponse> getAnomalies(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String employeeCode,
            @RequestParam(required = false) String email,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        return anomalyReviewService.getAnomalies(employeeId, employeeCode, email, startDate, endDate, page, size);
    }

    @GetMapping("/employees/{employeeId}/anomalies")
    public List<AnomalyReviewResponse> getEmployeeAnomalies(
            @PathVariable Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        return anomalyReviewService.getAnomalies(employeeId, null, null, startDate, endDate, null, null);
    }
}
