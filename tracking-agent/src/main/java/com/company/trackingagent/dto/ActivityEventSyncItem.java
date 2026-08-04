package com.company.trackingagent.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ActivityEventSyncItem {

    private Long agentEventId;

    private String status;

    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

    private Boolean recovered;
}
