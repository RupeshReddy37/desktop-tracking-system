package com.company.trackingserver.controller;

import com.company.trackingserver.dto.DashboardHomeResponse;
import com.company.trackingserver.service.DashboardHomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardHomeController {

    private final DashboardHomeService dashboardHomeService;

    @GetMapping("/home")
    public DashboardHomeResponse getHomeDashboard(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String employeeCode,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        return dashboardHomeService.getHomeDashboard(
                employeeId,
                employeeCode,
                email,
                status,
                sortBy,
                sortDirection,
                page,
                size,
                date);
    }
}
