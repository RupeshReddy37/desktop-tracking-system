package com.company.trackingagent.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AgentSyncResponse {

    private Boolean success;

    private Long deviceId;

    private Integer receivedWindowEvents;

    private Integer savedWindowEvents;

    private Integer receivedActivityEvents;

    private Integer savedActivityEvents;

    private Integer receivedSystemEvents;

    private Integer savedSystemEvents;

    private String message;
}
