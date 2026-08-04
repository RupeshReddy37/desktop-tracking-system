package com.company.trackingserver.dto;

import java.util.List;

public record DashboardHomeResponse(
        DashboardEmployeeCounts counts,
        int page,
        int size,
        long totalElements,
        int totalPages,
        List<EmployeeDashboardRow> employees) {
}
