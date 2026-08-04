package com.company.trackingagent.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WindowEventSyncItem {

    private Long agentEventId;

    private String windowTitle;

    private String processName;

    private String applicationName;

    private String documentTitle;

    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

    private Boolean recovered;
}
