package com.company.trackingserver.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import com.company.trackingserver.model.ActivityStatus;

@Getter
@Setter
public class ActivityEventSyncItem {

    @NotNull
    private Long agentEventId;

    @NotNull
    private ActivityStatus status;

    @NotNull
    private LocalDateTime startedAt;

    @NotNull
    private LocalDateTime endedAt;

    private Boolean recovered;
}
