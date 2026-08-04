package com.company.trackingagent.model;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.stereotype.Component;;

@Component
public class ActivityState {

    private ActivityStatus currentStatus;
    private LocalDateTime statusChangedAt;

    public ActivityState() {
        this.currentStatus = ActivityStatus.ACTIVE;
        this.statusChangedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public ActivityStatus getCurrentStatus() {
        return currentStatus;
    }

    public void setCurrentStatus(ActivityStatus currentStatus) {
        this.currentStatus = currentStatus;
    }

    public LocalDateTime getStatusChangedAt() {
        return statusChangedAt;
    }

    public void setStatusChangedAt(LocalDateTime statusChangedAt) {
        this.statusChangedAt = statusChangedAt;
    }
}
