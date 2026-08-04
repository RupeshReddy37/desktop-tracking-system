package com.company.trackingserver.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WindowEventSyncItem {

    @NotNull
    private Long agentEventId;

    @NotBlank
    private String windowTitle;

    private String processName;

    private String applicationName;

    private String documentTitle;

    @NotNull
    private LocalDateTime startedAt;

    @NotNull
    private LocalDateTime endedAt;

    private Boolean recovered;
}
