package com.company.trackingagent.windows;

import org.springframework.stereotype.Component;

import com.sun.jna.Native;
import com.sun.jna.platform.win32.WinNT;
import com.sun.jna.win32.StdCallLibrary;

@Component
public class WindowsLockStateMonitor {

    private static final int DESKTOP_SWITCHDESKTOP = 0x0100;

    public boolean isLocked() {

        if (!System.getProperty("os.name", "").toLowerCase().contains("windows")) {
            return false;
        }

        WinNT.HANDLE desktop = User32Desktop.INSTANCE.OpenInputDesktop(
                0,
                false,
                DESKTOP_SWITCHDESKTOP);

        if (desktop == null) {
            return true;
        }

        try {
            return !User32Desktop.INSTANCE.SwitchDesktop(desktop);
        } finally {
            User32Desktop.INSTANCE.CloseDesktop(desktop);
        }
    }

    private interface User32Desktop extends StdCallLibrary {

        User32Desktop INSTANCE = Native.load("user32", User32Desktop.class);

        WinNT.HANDLE OpenInputDesktop(
                int flags,
                boolean inherit,
                int desiredAccess);

        boolean SwitchDesktop(WinNT.HANDLE desktop);

        boolean CloseDesktop(WinNT.HANDLE desktop);
    }
}
