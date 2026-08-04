package com.company.trackingserver.service;

import com.company.trackingserver.entity.ActivityEvent;
import com.company.trackingserver.entity.Device;
import com.company.trackingserver.entity.EmployeeDailySummary;
import com.company.trackingserver.entity.EmployeeDailyWindowUsage;
import com.company.trackingserver.entity.WindowEvent;
import com.company.trackingserver.repository.ActivityEventRepository;
import com.company.trackingserver.repository.DeviceRepository;
import com.company.trackingserver.repository.EmployeeDailySummaryRepository;
import com.company.trackingserver.repository.EmployeeDailyWindowUsageRepository;
import com.company.trackingserver.repository.WindowEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyAggregationService {

    private final DeviceRepository deviceRepository;
    private final WindowEventRepository windowEventRepository;
    private final ActivityEventRepository activityEventRepository;
    private final EmployeeDailySummaryRepository employeeDailySummaryRepository;
    private final EmployeeDailyWindowUsageRepository employeeDailyWindowUsageRepository;

    @Transactional
    public void aggregateDate(LocalDate usageDate) {
        LocalDateTime start = usageDate.atStartOfDay();
        LocalDateTime end = usageDate.plusDays(1).atStartOfDay();
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        employeeDailySummaryRepository.deleteByUsageDate(usageDate);
        employeeDailyWindowUsageRepository.deleteByUsageDate(usageDate);

        List<EmployeeDailySummary> summaryRows = new ArrayList<>();
        List<EmployeeDailyWindowUsage> detailRows = new ArrayList<>();

        for (Device device : deviceRepository.findAll()) {
            List<ActivityEvent> activities = activityEventRepository.findOverlappingByDeviceId(
                    device.getId(),
                    start,
                    end);
            List<WindowEvent> windows = windowEventRepository.findOverlappingByDeviceId(
                    device.getId(),
                    start,
                    end);

            EmployeeTotals employeeTotals = buildEmployeeTotals(start, end, activities);
            summaryRows.add(buildSummaryRow(device, usageDate, now, employeeTotals));
            detailRows.addAll(buildWindowRows(device, usageDate, now, windows, activities, start, end));
        }

        employeeDailySummaryRepository.saveAll(summaryRows);
        employeeDailyWindowUsageRepository.saveAll(detailRows);

        log.info("Aggregated daily employee report for {}: summaryRows={}, detailRows={}",
                usageDate,
                summaryRows.size(),
                detailRows.size());
    }

    public void aggregateYesterday() {
        aggregateDate(LocalDate.now(ZoneOffset.UTC).minusDays(1));
    }

    private EmployeeDailySummary buildSummaryRow(
            Device device,
            LocalDate usageDate,
            LocalDateTime now,
            EmployeeTotals employeeTotals) {

        EmployeeDailySummary summary = new EmployeeDailySummary();
        summary.setEmployee(device.getEmployee());
        summary.setUsageDate(usageDate);
        summary.setActiveSeconds(employeeTotals.activeSeconds);
        summary.setIdleSeconds(employeeTotals.idleSeconds);
        summary.setTrackedSeconds(employeeTotals.activeSeconds + employeeTotals.idleSeconds);
        summary.setUpdatedAt(now);
        return summary;
    }

    private EmployeeTotals buildEmployeeTotals(
            LocalDateTime start,
            LocalDateTime end,
            List<ActivityEvent> activities) {

        long activeSeconds = 0;
        long idleSeconds = 0;

        for (ActivityEvent activity : activities) {
            LocalDateTime clippedStart = max(activity.getStartedAt(), start);
            LocalDateTime clippedEnd = min(resolveEnd(activity.getEndedAt(), end), end);
            if (!clippedStart.isBefore(clippedEnd)) {
                continue;
            }

            long seconds = Duration.between(clippedStart, clippedEnd).getSeconds();
            if (seconds <= 0) {
                continue;
            }

            if ("ACTIVE".equalsIgnoreCase(activity.getStatus())) {
                activeSeconds += seconds;
            } else {
                idleSeconds += seconds;
            }
        }

        return new EmployeeTotals(activeSeconds, idleSeconds);
    }

    private List<EmployeeDailyWindowUsage> buildWindowRows(
            Device device,
            LocalDate usageDate,
            LocalDateTime now,
            List<WindowEvent> windows,
            List<ActivityEvent> activities,
            LocalDateTime start,
            LocalDateTime end) {

        Map<String, WindowBucket> buckets = new LinkedHashMap<>();

        for (WindowEvent window : windows) {
            LocalDateTime clippedWindowStart = max(window.getStartedAt(), start);
            LocalDateTime clippedWindowEnd = min(resolveEnd(window.getEndedAt(), end), end);

            if (!clippedWindowStart.isBefore(clippedWindowEnd)) {
                continue;
            }

            String applicationName = normalizeApplicationName(window.getApplicationName());
            String processName = normalizeText(window.getProcessName());
            String windowTitle = normalizeTitle(window.getWindowTitle(), 500, "Unknown window");
            String documentTitle = normalizeTitle(window.getDocumentTitle(), 500, "");
            String fileName = extractFileName(documentTitle, windowTitle);
            String detailKey = buildDetailKey(applicationName, processName, windowTitle, documentTitle, fileName);

            WindowBucket bucket = buckets.computeIfAbsent(detailKey, ignored -> new WindowBucket(
                    detailKey,
                    applicationName,
                    processName,
                    windowTitle,
                    documentTitle,
                    fileName));

            for (ActivityEvent activity : activities) {
                LocalDateTime clippedActivityStart = max(activity.getStartedAt(), start);
                LocalDateTime clippedActivityEnd = min(resolveEnd(activity.getEndedAt(), end), end);

                if (!clippedActivityStart.isBefore(clippedActivityEnd)) {
                    continue;
                }

                long overlapSeconds = overlapSeconds(
                        clippedWindowStart,
                        clippedWindowEnd,
                        clippedActivityStart,
                        clippedActivityEnd);

                if (overlapSeconds <= 0) {
                    continue;
                }

                if ("ACTIVE".equalsIgnoreCase(activity.getStatus())) {
                    bucket.activeSeconds += overlapSeconds;
                } else {
                    bucket.idleSeconds += overlapSeconds;
                }
            }
        }

        return buckets.values().stream()
                .map(bucket -> toDetailRow(device, usageDate, now, bucket))
                .toList();
    }

    private EmployeeDailyWindowUsage toDetailRow(
            Device device,
            LocalDate usageDate,
            LocalDateTime now,
            WindowBucket bucket) {

        EmployeeDailyWindowUsage usage = new EmployeeDailyWindowUsage();
        usage.setEmployee(device.getEmployee());
        usage.setUsageDate(usageDate);
        usage.setDetailKey(bucket.detailKey);
        usage.setApplicationName(bucket.applicationName);
        usage.setProcessName(bucket.processName);
        usage.setWindowTitle(bucket.windowTitle);
        usage.setDocumentTitle(bucket.documentTitle);
        usage.setFileName(bucket.fileName);
        usage.setActiveSeconds(bucket.activeSeconds);
        usage.setIdleSeconds(bucket.idleSeconds);
        usage.setTrackedSeconds(bucket.activeSeconds + bucket.idleSeconds);
        usage.setUpdatedAt(now);
        return usage;
    }

    private long overlapSeconds(
            LocalDateTime startA,
            LocalDateTime endA,
            LocalDateTime startB,
            LocalDateTime endB) {

        LocalDateTime overlapStart = max(startA, startB);
        LocalDateTime overlapEnd = min(endA, endB);

        if (!overlapStart.isBefore(overlapEnd)) {
            return 0;
        }

        return Duration.between(overlapStart, overlapEnd).getSeconds();
    }

    private LocalDateTime resolveEnd(LocalDateTime endAt, LocalDateTime fallback) {
        return endAt == null ? fallback : endAt;
    }

    private LocalDateTime max(LocalDateTime left, LocalDateTime right) {
        return left.isAfter(right) ? left : right;
    }

    private LocalDateTime min(LocalDateTime left, LocalDateTime right) {
        return left.isBefore(right) ? left : right;
    }

    private String normalizeApplicationName(String value) {
        return normalizeText(value, "Unknown");
    }

    private String normalizeText(String value) {
        return normalizeText(value, "");
    }

    private String normalizeText(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private String normalizeTitle(String value, int maxLength, String fallback) {
        String normalized = normalizeText(value, fallback);
        return normalized.length() > maxLength ? normalized.substring(0, maxLength) : normalized;
    }

    private String extractFileName(String documentTitle, String windowTitle) {
        String source = !documentTitle.isBlank() ? documentTitle : windowTitle;
        if (source == null || source.isBlank()) {
            return "";
        }

        String candidate = source.replace('\\', '/');
        int slash = candidate.lastIndexOf('/');
        if (slash >= 0 && slash < candidate.length() - 1) {
            candidate = candidate.substring(slash + 1);
        }

        if (candidate.length() > 255) {
            candidate = candidate.substring(0, 255);
        }
        return candidate;
    }

    private String buildDetailKey(
            String applicationName,
            String processName,
            String windowTitle,
            String documentTitle,
            String fileName) {

        String rawKey = String.join("|",
                safeKey(applicationName),
                safeKey(processName),
                safeKey(windowTitle),
                safeKey(documentTitle),
                safeKey(fileName));
        try {
            MessageDigest digest = MessageDigest.getInstance("MD5");
            byte[] hash = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte value : hash) {
                builder.append(String.format("%02x", value));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException ex) {
            return Integer.toHexString(rawKey.hashCode());
        }
    }

    private String safeKey(String value) {
        return value == null ? "" : value.trim();
    }

    private static class EmployeeTotals {
        private final long activeSeconds;
        private final long idleSeconds;

        private EmployeeTotals(long activeSeconds, long idleSeconds) {
            this.activeSeconds = activeSeconds;
            this.idleSeconds = idleSeconds;
        }
    }

    private static class WindowBucket {
        private final String detailKey;
        private final String applicationName;
        private final String processName;
        private final String windowTitle;
        private final String documentTitle;
        private final String fileName;
        private long activeSeconds;
        private long idleSeconds;

        private WindowBucket(
                String detailKey,
                String applicationName,
                String processName,
                String windowTitle,
                String documentTitle,
                String fileName) {
            this.detailKey = Objects.requireNonNull(detailKey);
            this.applicationName = Objects.requireNonNull(applicationName);
            this.processName = processName;
            this.windowTitle = Objects.requireNonNull(windowTitle);
            this.documentTitle = documentTitle;
            this.fileName = fileName;
        }
    }
}
