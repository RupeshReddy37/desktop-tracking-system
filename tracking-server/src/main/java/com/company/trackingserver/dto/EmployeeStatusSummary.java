package com.company.trackingserver.dto;

import java.time.LocalDateTime;

public interface EmployeeStatusSummary {

    Long getEmployeeId();

    String getEmployeeCode();

    String getFirstName();

    String getLastName();

    String getEmail();

    Long getDeviceId();

    String getHostname();

    String getCurrentStatus();

    LocalDateTime getStatusSinceAt();

    LocalDateTime getLastSeenAt();

    Long getActiveSecondsToday();

    Long getIdleSecondsToday();

    Long getLockedSecondsToday();

    Long getOfflineSecondsToday();
}
