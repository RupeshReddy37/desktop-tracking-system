package com.company.trackingserver.dto;

public interface ApplicationUsageSummary {

    String getApplicationName();

    String getProcessName();

    Long getTotalSeconds();
}
