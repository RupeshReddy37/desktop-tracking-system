package com.company.trackingagent.collector;

import com.company.trackingagent.windows.WindowsIdleMonitor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class IdleCollector {

    private final WindowsIdleMonitor windowsIdleMonitor;

    public long collect() {
        return windowsIdleMonitor.getIdleSeconds();
    }
}