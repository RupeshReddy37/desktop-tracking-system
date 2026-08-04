package com.company.trackingserver.dto;

import java.time.LocalDateTime;

import com.company.trackingserver.model.SystemEventType;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SystemEventSyncItem {

    @NotNull
    private Long agentEventId;

    @NotNull
    private SystemEventType type;

    @NotNull
    private LocalDateTime observedAt;
}
