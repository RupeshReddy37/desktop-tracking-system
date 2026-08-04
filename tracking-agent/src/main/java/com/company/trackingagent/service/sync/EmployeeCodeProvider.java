package com.company.trackingagent.service.sync;

import java.io.BufferedReader;
import java.io.Console;
import java.io.IOException;
import java.io.InputStreamReader;

import org.springframework.stereotype.Component;

import com.company.trackingagent.config.TrackingProperties;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class EmployeeCodeProvider {

    private final TrackingProperties trackingProperties;

    public String resolveEmployeeCodeForRegistration() {

        String configuredEmployeeCode = trackingProperties.getEmployeeCode();
        if (configuredEmployeeCode != null && !configuredEmployeeCode.isBlank()) {
            return configuredEmployeeCode.trim();
        }

        if (!trackingProperties.isPromptForEmployeeCode()) {
            throw new IllegalStateException(
                    "tracking.employee-code is required for first registration");
        }

        return promptForEmployeeCode();
    }

    private String promptForEmployeeCode() {

        String employeeCode = readEmployeeCode();

        if (employeeCode == null || employeeCode.isBlank()) {
            throw new IllegalStateException(
                    "Employee code is required for first registration");
        }

        return employeeCode.trim();
    }

    private String readEmployeeCode() {

        Console console = System.console();
        if (console != null) {
            return console.readLine("Enter employee code for first-time agent registration: ");
        }

        try {
            System.out.print("Enter employee code for first-time agent registration: ");
            return new BufferedReader(new InputStreamReader(System.in)).readLine();
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Unable to read employee code from console",
                    exception);
        }
    }
}
