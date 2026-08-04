package com.company.trackingserver.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AgentSyncRequest {

    @NotNull
    private Long deviceId;

    @Valid
    @NotNull
    private List<WindowEventSyncItem> windowEvents;

    @Valid
    @NotNull
    private List<ActivityEventSyncItem> activityEvents;

    @Valid
    @NotNull
    private List<SystemEventSyncItem> systemEvents;
}
