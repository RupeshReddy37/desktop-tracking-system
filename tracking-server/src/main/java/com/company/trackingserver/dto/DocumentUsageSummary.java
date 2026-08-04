package com.company.trackingserver.dto;

public interface DocumentUsageSummary {

    String getApplicationName();

    String getDocumentTitle();

    Long getTotalSeconds();
}
