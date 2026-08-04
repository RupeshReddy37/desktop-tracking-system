package com.company.trackingserver.scheduler;

import com.company.trackingserver.service.DailyAggregationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DailyAggregationScheduler {

    private final DailyAggregationService dailyAggregationService;

    @Scheduled(cron = "0 15 0 * * *", zone = "UTC")
    public void aggregateYesterday() {
        log.info("Running daily aggregation job for yesterday");
        dailyAggregationService.aggregateYesterday();
    }
}
