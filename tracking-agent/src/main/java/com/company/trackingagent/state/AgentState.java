package com.company.trackingagent.state;

import com.company.trackingagent.model.ActivityStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AgentState {
    private String currentWindow;
    private ActivityStatus currentActivityStatus;
    private boolean currentIdleStatus;
    private LocalDateTime sessionStartTime;
}