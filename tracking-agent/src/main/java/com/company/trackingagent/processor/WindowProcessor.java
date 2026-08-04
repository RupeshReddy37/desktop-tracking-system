package com.company.trackingagent.processor;


import com.company.trackingagent.model.ActiveWindowInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WindowProcessor {

    public WindowChangeResult process(String currentWindow, ActiveWindowInfo newWindow) {
        if (newWindow == null || newWindow.getWindowTitle() == null
                || newWindow.getWindowTitle().isBlank()) {
            return new WindowChangeResult(false, null);
        }
        if (currentWindow != null && currentWindow.equals(newWindow.identity())) {
            return new WindowChangeResult(false, newWindow);
        }
        return new WindowChangeResult(true, newWindow);
    }

    public static class WindowChangeResult {
        private final boolean changed;
        private final ActiveWindowInfo newWindow;

        public WindowChangeResult(boolean changed, ActiveWindowInfo newWindow) {
            this.changed = changed;
            this.newWindow = newWindow;
        }

        public boolean isChanged() {
            return changed;
        }

        public ActiveWindowInfo getNewWindow() {
            return newWindow;
        }
    }
}
