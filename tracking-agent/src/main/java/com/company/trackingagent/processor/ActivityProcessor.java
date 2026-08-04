package com.company.trackingagent.processor;

import com.company.trackingagent.config.TrackingProperties;
import com.company.trackingagent.model.ActivityStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ActivityProcessor {

    private final TrackingProperties trackingProperties;

    public ActivityStatus process(long idleSeconds, ActivityStatus currentStatus) {
        ActivityStatus newStatus =
                idleSeconds >= trackingProperties
                        .getActivity()
                        .getIdleThresholdSeconds()
                        ? ActivityStatus.IDLE
                        : ActivityStatus.ACTIVE;
        if (currentStatus != null && currentStatus.equals(newStatus)) {
            return currentStatus;
        }
        return newStatus;
    }
}
