package com.company.trackingserver.dto;

import java.time.LocalDateTime;

public interface EmployeeDashboardSummary {

    Long getEmployeeId();

    String getEmployeeCode();

    String getFirstName();

    String getLastName();

    String getEmail();

    String getCurrentStatus();

    LocalDateTime getStatusSinceAt();

    LocalDateTime getLastSeenAt();

    Long getActiveSecondsToday();

    Long getIdleSecondsToday();

    Long getLockedSecondsToday();

    Long getOfflineSecondsToday();
}
