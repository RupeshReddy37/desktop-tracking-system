package com.company.trackingserver.service;

import com.company.trackingserver.dto.DashboardEmployeeCounts;
import com.company.trackingserver.dto.DashboardHomeResponse;
import com.company.trackingserver.dto.EmployeeDashboardRow;
import com.company.trackingserver.dto.EmployeeDashboardSummary;
import com.company.trackingserver.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class DashboardHomeService {

    private final DeviceRepository deviceRepository;

    public DashboardHomeResponse getHomeDashboard(
            Long employeeId,
            String employeeCode,
            String email,
            String status,
            String sortBy,
            String sortDirection,
            Integer page,
            Integer size,
            LocalDate date) {

        LocalDate reportDate = date == null ? LocalDate.now(ZoneOffset.UTC) : date;
        LocalDateTime start = reportDate.atStartOfDay();
        LocalDateTime end = reportDate.plusDays(1).atStartOfDay();
        LocalDateTime offlineBefore = LocalDateTime.now(ZoneOffset.UTC).minusMinutes(5);
        int pageNumber = page == null ? 0 : Math.max(0, page);
        int pageSize = size == null ? 50 : Math.max(1, Math.min(size, 200));

        List<EmployeeDashboardRow> rows = deviceRepository
                .summarizeEmployeeDashboard(
                        employeeId,
                        blankToNull(employeeCode),
                        blankToNull(email),
                        start,
                        end,
                        offlineBefore)
                .stream()
                .map(this::toRow)
                .toList();

        DashboardEmployeeCounts counts = buildCounts(rows);

        List<EmployeeDashboardRow> filtered = applyStatusFilter(rows, status);
        List<EmployeeDashboardRow> sorted = sortRows(filtered, sortBy, sortDirection);
        long totalElements = sorted.size();
        int totalPages = (int) Math.ceil((double) totalElements / pageSize);
        int fromIndex = Math.min(pageNumber * pageSize, sorted.size());
        int toIndex = Math.min(fromIndex + pageSize, sorted.size());

        return new DashboardHomeResponse(
                counts,
                pageNumber,
                pageSize,
                totalElements,
                totalPages,
                sorted.subList(fromIndex, toIndex));
    }

    private EmployeeDashboardRow toRow(EmployeeDashboardSummary summary) {
        return new EmployeeDashboardRow(
                summary.getEmployeeId(),
                summary.getEmployeeCode(),
                summary.getFirstName(),
                summary.getLastName(),
                summary.getEmail(),
                summary.getCurrentStatus(),
                summary.getStatusSinceAt(),
                summary.getLastSeenAt(),
                summary.getActiveSecondsToday(),
                summary.getIdleSecondsToday(),
                summary.getLockedSecondsToday(),
                summary.getOfflineSecondsToday());
    }

    private DashboardEmployeeCounts buildCounts(List<EmployeeDashboardRow> rows) {
        long active = rows.stream().filter(row -> "ACTIVE".equalsIgnoreCase(row.currentStatus())).count();
        long idle = rows.stream().filter(row -> "IDLE".equalsIgnoreCase(row.currentStatus())).count();
        long locked = rows.stream().filter(row -> "LOCKED".equalsIgnoreCase(row.currentStatus())).count();
        long offline = rows.stream().filter(row -> "OFFLINE".equalsIgnoreCase(row.currentStatus())).count();
        long notRegistered = rows.stream().filter(row -> "NOT_REGISTERED".equalsIgnoreCase(row.currentStatus())).count();
        long unknown = rows.stream().filter(row -> "UNKNOWN".equalsIgnoreCase(row.currentStatus())).count();

        return new DashboardEmployeeCounts(
                rows.size(),
                active,
                idle,
                locked,
                offline,
                notRegistered,
                unknown);
    }

    private List<EmployeeDashboardRow> applyStatusFilter(List<EmployeeDashboardRow> rows, String status) {
        if (status == null || status.isBlank()) {
            return rows;
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        return rows.stream()
                .filter(row -> normalized.equalsIgnoreCase(row.currentStatus()))
                .toList();
    }

    private List<EmployeeDashboardRow> sortRows(
            List<EmployeeDashboardRow> rows,
            String sortBy,
            String sortDirection) {

        Comparator<EmployeeDashboardRow> comparator = comparatorFor(sortBy);
        if ("DESC".equalsIgnoreCase(sortDirection)) {
            comparator = comparator.reversed();
        }
        return rows.stream()
                .sorted(comparator)
                .toList();
    }

    private Comparator<EmployeeDashboardRow> comparatorFor(String sortBy) {
        String key = sortBy == null ? "lastSeenAt" : sortBy.trim();
        return switch (key) {
            case "employeeCode" -> Comparator.comparing(EmployeeDashboardRow::employeeCode, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "name", "firstName" -> Comparator.comparing(EmployeeDashboardRow::firstName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                    .thenComparing(EmployeeDashboardRow::lastName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "email" -> Comparator.comparing(EmployeeDashboardRow::email, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "status" -> Comparator.comparing(EmployeeDashboardRow::currentStatus, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "activeSeconds" -> Comparator.comparing(EmployeeDashboardRow::activeSecondsToday, Comparator.nullsLast(Comparator.naturalOrder()));
            case "idleSeconds" -> Comparator.comparing(EmployeeDashboardRow::idleSecondsToday, Comparator.nullsLast(Comparator.naturalOrder()));
            case "lockedSeconds" -> Comparator.comparing(EmployeeDashboardRow::lockedSecondsToday, Comparator.nullsLast(Comparator.naturalOrder()));
            case "offlineSeconds" -> Comparator.comparing(EmployeeDashboardRow::offlineSecondsToday, Comparator.nullsLast(Comparator.naturalOrder()));
            case "statusSinceAt" -> Comparator.comparing(EmployeeDashboardRow::statusSinceAt, Comparator.nullsLast(Comparator.naturalOrder()));
            case "lastSeenAt" -> Comparator.comparing(EmployeeDashboardRow::lastSeenAt, Comparator.nullsLast(Comparator.naturalOrder()));
            default -> Comparator.comparing(EmployeeDashboardRow::lastSeenAt, Comparator.nullsLast(Comparator.naturalOrder()));
        };
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
