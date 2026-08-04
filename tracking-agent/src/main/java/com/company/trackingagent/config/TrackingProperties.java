package com.company.trackingagent.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "tracking")
public class TrackingProperties {

    private boolean promptForEmployeeCode = true;

    private String serverUrl;

    private String employeeCode;

    private String agentVersion;

    private Sync sync = new Sync();

    private Activity activity = new Activity();

    private Retention retention = new Retention();

    @Getter
    @Setter
    public static class Sync {

        private boolean enabled = true;

        private int batchSize = 100;

        private long requestTimeoutSeconds = 15;

        private long shutdownTimeoutSeconds = 20;

        private long retentionDaysAfterSync = 4;

        private long initialDelayMs = 60000;

        private long fixedDelayMs = 120000;
    }

    @Getter
    @Setter
    public static class Activity {

        private long idleThresholdSeconds = 300;

        private long longSessionMaxSeconds = 900;

        private long windowSwitchDebounceSeconds = 5;

        private long pollInitialDelayMs = 10000;

        private long pollDelayMs = 5000;

        private long suspendResumeGapSeconds = 120;
    }

    @Getter
    @Setter
    public static class Retention {

        private long initialDelayMs = 300000;

        private long fixedDelayMs = 21600000;
    }
}
