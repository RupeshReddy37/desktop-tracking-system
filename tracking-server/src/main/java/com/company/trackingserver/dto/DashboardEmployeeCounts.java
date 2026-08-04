package com.company.trackingserver.dto;

public record DashboardEmployeeCounts(
        long totalEmployees,
        long activeEmployees,
        long idleEmployees,
        long lockedEmployees,
        long offlineEmployees,
        long notRegisteredEmployees,
        long unknownEmployees) {
}
