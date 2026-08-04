package com.company.trackingagent.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SystemEventSyncItem {

    private Long agentEventId;

    private String type;

    private LocalDateTime observedAt;
}
