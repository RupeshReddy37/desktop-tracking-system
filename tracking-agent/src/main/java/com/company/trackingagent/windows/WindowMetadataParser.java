package com.company.trackingagent.windows;

import java.util.Arrays;

import org.springframework.stereotype.Component;

@Component
public class WindowMetadataParser {

    private static final int MAX_TITLE_LENGTH = 500;

    public String resolveApplicationName(
            String processName,
            String windowTitle) {

        String normalizedProcessName = normalizeTitleValue(processName);
        String normalizedWindowTitle = normalizeTitleValue(windowTitle);

        if (normalizedProcessName == null || normalizedProcessName.isBlank()) {
            return tailWindowPart(normalizedWindowTitle);
        }

        return switch (normalizedProcessName.toLowerCase()) {
            case "code.exe" -> "Visual Studio Code";
            case "msedge.exe" -> "Microsoft Edge";
            case "chrome.exe" -> "Google Chrome";
            case "firefox.exe" -> "Mozilla Firefox";
            case "explorer.exe" -> "File Explorer";
            case "notepad.exe" -> "Notepad";
            default -> stripExe(normalizedProcessName);
        };
    }

    public String resolveDocumentTitle(
            String windowTitle,
            String applicationName,
            String processName) {

        String normalizedWindowTitle = normalizeTitleValue(windowTitle);
        String normalizedApplicationName = normalizeTitleValue(applicationName);
        String normalizedProcessName = normalizeTitleValue(processName);

        if (normalizedWindowTitle == null || normalizedWindowTitle.isBlank()) {
            return null;
        }

        if (normalizedApplicationName == null || normalizedApplicationName.isBlank()) {
            return normalizedWindowTitle;
        }

        String browserTitle = stripBrowserSuffix(
                normalizedWindowTitle,
                normalizedApplicationName,
                normalizedProcessName);
        if (browserTitle != null) {
            return browserTitle;
        }

        String suffix = " - " + normalizedApplicationName;

        if (normalizedWindowTitle.endsWith(suffix)) {
            return normalizeTitleValue(normalizedWindowTitle.substring(
                    0,
                    normalizedWindowTitle.length() - suffix.length()));
        }

        return normalizedWindowTitle;
    }

    public String extractFileName(String path) {

        if (path == null || path.isBlank()) {
            return path;
        }

        int lastBackslash = path.lastIndexOf('\\');
        int lastSlash = path.lastIndexOf('/');
        int index = Math.max(lastBackslash, lastSlash);

        if (index < 0 || index == path.length() - 1) {
            return path;
        }

        return path.substring(index + 1);
    }

    private String stripBrowserSuffix(
            String windowTitle,
            String applicationName,
            String processName) {

        if (!isBrowserProcess(processName)) {
            return null;
        }

        String[] parts = windowTitle.split(" - ");
        if (parts.length < 2) {
            return windowTitle;
        }

        int endExclusive = parts.length;
        String lastPart = normalizeTitlePart(parts[endExclusive - 1]);
        String normalizedApplication = normalizeTitlePart(applicationName);

        if (!lastPart.equalsIgnoreCase(normalizedApplication)) {
            return null;
        }

        endExclusive--;

        if (endExclusive > 1 && isBrowserProfileName(parts[endExclusive - 1])) {
            endExclusive--;
        }

        return normalizeTitleValue(String.join(" - ", Arrays.copyOfRange(parts, 0, endExclusive)));
    }

    private boolean isBrowserProcess(String processName) {

        if (processName == null) {
            return false;
        }

        return switch (processName.toLowerCase()) {
            case "msedge.exe", "chrome.exe", "firefox.exe" -> true;
            default -> false;
        };
    }

    private boolean isBrowserProfileName(String value) {

        if (value == null) {
            return false;
        }

        return normalizeTitlePart(value).matches("(?i)(personal|profile|default|work)(\\s+\\d+)?");
    }

    private String normalizeTitlePart(String value) {

        return value == null ? "" : value.replaceAll("\\p{Cf}", "").trim();
    }

    private String stripExe(String processName) {

        if (processName.toLowerCase().endsWith(".exe")) {
            return normalizeTitleValue(processName.substring(0, processName.length() - 4));
        }

        return normalizeTitleValue(processName);
    }

    private String tailWindowPart(String windowTitle) {

        if (windowTitle == null || windowTitle.isBlank()) {
            return "Unknown";
        }

        String[] parts = windowTitle.split(" - ");

        return parts[parts.length - 1];
    }

    private String normalizeTitleValue(String value) {

        if (value == null) {
            return null;
        }

        String cleaned = value
                .replaceAll("\\p{C}", "")
                .replace('\u0000', ' ')
                .trim();

        if (cleaned.isEmpty()) {
            return null;
        }

        if (cleaned.length() <= MAX_TITLE_LENGTH) {
            return cleaned;
        }

        return cleaned.substring(0, MAX_TITLE_LENGTH);
    }
}
