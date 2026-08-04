package com.company.trackingagent.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AgentSyncRequest {

    private Long deviceId;

    private List<WindowEventSyncItem> windowEvents;

    private List<ActivityEventSyncItem> activityEvents;

    private List<SystemEventSyncItem> systemEvents;
}
