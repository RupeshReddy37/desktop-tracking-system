package com.company.trackingagent.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SqliteTuningInitializer implements ApplicationRunner {

    private final DataSource dataSource;

    @Override
    public void run(ApplicationArguments args) {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {

            statement.execute("PRAGMA journal_mode = WAL");
            statement.execute("PRAGMA synchronous = NORMAL");
            statement.execute("PRAGMA busy_timeout = 5000");
            normalizeLegacyTimestampValues(statement);

            log.info("Applied SQLite tuning pragmas");
        } catch (Exception exception) {
            log.warn("Unable to apply SQLite tuning pragmas: {}", exception.getMessage());
        }
    }

    private void normalizeLegacyTimestampValues(Statement statement) throws Exception {

        int repaired = 0;

        repaired += normalizeColumn(statement, "window_event", "started_at");
        repaired += normalizeColumn(statement, "window_event", "ended_at");
        repaired += normalizeColumn(statement, "window_event", "last_observed_at");
        repaired += normalizeColumn(statement, "window_event", "synced_at");

        repaired += normalizeColumn(statement, "activity_event", "started_at");
        repaired += normalizeColumn(statement, "activity_event", "ended_at");
        repaired += normalizeColumn(statement, "activity_event", "last_observed_at");
        repaired += normalizeColumn(statement, "activity_event", "synced_at");

        repaired += normalizeColumn(statement, "system_event", "observed_at");
        repaired += normalizeColumn(statement, "system_event", "synced_at");

        repaired += normalizeColumn(statement, "agent_device_state", "registered_at");
        repaired += normalizeColumn(statement, "agent_device_state", "last_sync_at");
        repaired += normalizeColumn(statement, "agent_device_state", "created_at");
        repaired += normalizeColumn(statement, "agent_device_state", "updated_at");

        if (repaired > 0) {
            log.warn("Repaired {} legacy SQLite timestamp value(s) stored as epoch millis", repaired);
        }
    }

    private int normalizeColumn(
            Statement statement,
            String tableName,
            String columnName) throws Exception {

        String sql = String.format("""
                UPDATE %s
                SET %s = strftime('%%Y-%%m-%%d %%H:%%M:%%f', CAST(%s AS REAL) / 1000.0, 'unixepoch')
                WHERE %s IS NOT NULL
                  AND (%s GLOB '[0-9]*' OR typeof(%s) IN ('integer', 'real'))
                """,
                tableName,
                columnName,
                columnName,
                columnName,
                columnName,
                columnName);

        return statement.executeUpdate(sql);
    }
}
