package com.company.trackingagent.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ActiveWindowInfo {

    private String windowTitle;

    private String processName;

    private String applicationName;

    private String documentTitle;

    public String identity() {

        return String.join(
                "|",
                nullToEmpty(processName),
                nullToEmpty(windowTitle));
    }

    private String nullToEmpty(String value) {

        return value == null ? "" : value;
    }
}
