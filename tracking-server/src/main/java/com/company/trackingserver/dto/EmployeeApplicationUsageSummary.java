package com.company.trackingserver.dto;

public interface EmployeeApplicationUsageSummary {

    String getApplicationName();

    String getProcessName();

    Long getActiveSeconds();

    Long getIdleSeconds();

    Long getTrackedSeconds();

    Long getEmployeeCount();

    Long getDayCount();
}
