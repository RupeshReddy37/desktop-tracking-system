package com.company.trackingagent.windows;

import com.company.trackingagent.model.ActiveWindowInfo;
import com.sun.jna.Native;
import com.sun.jna.platform.win32.Kernel32;
import com.sun.jna.platform.win32.Psapi;
import com.sun.jna.platform.win32.User32;
import com.sun.jna.platform.win32.WinDef.HWND;
import com.sun.jna.platform.win32.WinNT;
import com.sun.jna.ptr.IntByReference;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class WindowsWindowMonitor {

    private final WindowMetadataParser metadataParser;

    public WindowsWindowMonitor(WindowMetadataParser metadataParser) {
        this.metadataParser = metadataParser;
    }

    public ActiveWindowInfo getActiveWindow() {

        char[] windowText = new char[1024];

        HWND hwnd = User32.INSTANCE.GetForegroundWindow();

        if (hwnd == null) {
            return null;
        }

        int textLength = User32.INSTANCE.GetWindowText(
                hwnd,
                windowText,
                1024
        );

        if (textLength <= 0) {
            return null;
        }

        String windowTitle = Native.toString(windowText).trim();
        String processName = resolveProcessName(hwnd);

        ActiveWindowInfo info = new ActiveWindowInfo();

        info.setWindowTitle(windowTitle);
        info.setProcessName(processName);
        info.setApplicationName(metadataParser.resolveApplicationName(processName, windowTitle));
        info.setDocumentTitle(metadataParser.resolveDocumentTitle(
                windowTitle,
                info.getApplicationName(),
                processName));

        return info;
    }

    public String getActiveWindowTitle() {

        return getActiveWindow().getWindowTitle();
    }

    private String resolveProcessName(HWND hwnd) {

        if (hwnd == null) {
            return null;
        }

        IntByReference processId = new IntByReference();
        User32.INSTANCE.GetWindowThreadProcessId(hwnd, processId);

        WinNT.HANDLE process = Kernel32.INSTANCE.OpenProcess(
                WinNT.PROCESS_QUERY_INFORMATION | WinNT.PROCESS_VM_READ,
                false,
                processId.getValue());

        if (process == null) {
            return null;
        }

        try {
            char[] processName = new char[1024];
            int length = Psapi.INSTANCE.GetModuleFileNameExW(
                    process,
                    null,
                    processName,
                    processName.length);

            if (length <= 0) {
                return null;
            }

            return metadataParser.extractFileName(Native.toString(processName));
        } finally {
            Kernel32.INSTANCE.CloseHandle(process);
        }
    }
}
