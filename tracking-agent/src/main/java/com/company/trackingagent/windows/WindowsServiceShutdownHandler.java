package com.company.trackingagent.windows;

import org.springframework.stereotype.Component;

import com.company.trackingagent.listener.ShutdownCoordinator;
import com.sun.jna.Native;
import com.sun.jna.win32.StdCallLibrary;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class WindowsServiceShutdownHandler {

    private static final int CTRL_CLOSE_EVENT = 2;
    private static final int CTRL_LOGOFF_EVENT = 5;
    private static final int CTRL_SHUTDOWN_EVENT = 6;

    private final ShutdownCoordinator shutdownCoordinator;
    private Kernel32ConsoleHandler consoleHandler;

    @PostConstruct
    public void register() {

        if (!System.getProperty("os.name", "").toLowerCase().contains("windows")) {
            return;
        }

        consoleHandler = controlType -> {
            if (controlType == CTRL_CLOSE_EVENT
                    || controlType == CTRL_LOGOFF_EVENT
                    || controlType == CTRL_SHUTDOWN_EVENT) {
                shutdownCoordinator.closeSessionsAndSync("windows-control-" + controlType);
                return true;
            }

            return false;
        };

        boolean registered = Kernel32Console.INSTANCE.SetConsoleCtrlHandler(
                consoleHandler,
                true);

        if (!registered) {
            log.warn("Unable to register Windows shutdown handler");
        }
    }

    private interface Kernel32Console extends StdCallLibrary {

        Kernel32Console INSTANCE = Native.load("kernel32", Kernel32Console.class);

        boolean SetConsoleCtrlHandler(
                Kernel32ConsoleHandler handler,
                boolean add);
    }

    private interface Kernel32ConsoleHandler extends StdCallLibrary.StdCallCallback {

        boolean callback(int controlType);
    }
}
