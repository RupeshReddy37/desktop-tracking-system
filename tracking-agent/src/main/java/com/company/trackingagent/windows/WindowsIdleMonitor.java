package com.company.trackingagent.windows;

import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

import com.sun.jna.platform.win32.Kernel32;
import com.sun.jna.platform.win32.User32; 
import com.sun.jna.platform.win32.WinUser; 


@Slf4j
@Component
public class WindowsIdleMonitor {

    public long getIdleSeconds() {

        WinUser.LASTINPUTINFO lastInputInfo = new WinUser.LASTINPUTINFO();

        lastInputInfo.cbSize = lastInputInfo.size();

        if (!User32.INSTANCE.GetLastInputInfo(lastInputInfo)) {
            log.warn("Unable to read Windows idle time");
            return 0;
        }

        long idleMillis =
                Kernel32.INSTANCE.GetTickCount64()
                        - lastInputInfo.dwTime;

        log.debug("Read Windows idle time");

        return idleMillis / 1000;
    }
}
