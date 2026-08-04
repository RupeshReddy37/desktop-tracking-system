package com.company.trackingagent.collector;

import com.company.trackingagent.model.ActiveWindowInfo;
import com.company.trackingagent.windows.WindowsWindowMonitor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WindowCollector {

    private final WindowsWindowMonitor windowsWindowMonitor;

    public ActiveWindowInfo collect() {
        return windowsWindowMonitor.getActiveWindow();
    }
}
