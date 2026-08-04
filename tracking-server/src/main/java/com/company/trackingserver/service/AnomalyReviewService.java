package com.company.trackingserver.service;

import com.company.trackingserver.dto.AnomalyReviewResponse;
import com.company.trackingserver.entity.ActivityAnomaly;
import com.company.trackingserver.repository.ActivityAnomalyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnomalyReviewService {

    private final ActivityAnomalyRepository activityAnomalyRepository;

    public List<AnomalyReviewResponse> getAnomalies(
            Long employeeId,
            String employeeCode,
            String email,
            LocalDate startDate,
            LocalDate endDate,
            Integer page,
            Integer size) {

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay();
        int pageNumber = page == null ? 0 : Math.max(0, page);
        int pageSize = size == null ? 50 : Math.max(1, Math.min(size, 200));
        Pageable pageable = PageRequest.of(
                pageNumber,
                pageSize,
                Sort.by(Sort.Direction.DESC, "detectedAt", "confidence"));

        return activityAnomalyRepository.searchAnomalies(
                        employeeId,
                        blankToEmpty(employeeCode),
                        blankToEmpty(email),
                        startDateTime,
                        endDateTime,
                        pageable)
                .map(this::toResponse)
                .getContent();
    }

    private AnomalyReviewResponse toResponse(ActivityAnomaly anomaly) {
        return new AnomalyReviewResponse(
                anomaly.getEmployee().getId(),
                anomaly.getEmployee().getEmployeeCode(),
                anomaly.getEmployee().getFirstName(),
                anomaly.getEmployee().getLastName(),
                anomaly.getEmployee().getEmail(),
                anomaly.getDetectedAt(),
                anomaly.getAnomalyType(),
                anomaly.getConfidence(),
                anomaly.getReasonSummary(),
                anomaly.getReviewStatus());
    }

    private String blankToEmpty(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }
}
