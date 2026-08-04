package com.company.trackingagent.service.sync;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import org.springframework.stereotype.Component;

import com.company.trackingagent.config.TrackingProperties;
import com.company.trackingagent.dto.AgentSyncRequest;
import com.company.trackingagent.dto.AgentSyncResponse;
import com.company.trackingagent.dto.DeviceRegistrationRequest;
import com.company.trackingagent.dto.DeviceRegistrationResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AgentHttpClient {

        private final TrackingProperties trackingProperties;
        private final ObjectMapper objectMapper;

        public DeviceRegistrationResponse registerDevice(
                        DeviceRegistrationRequest request)
                        throws IOException, InterruptedException {

                return post(
                                "/api/v1/devices/register",
                                request,
                                DeviceRegistrationResponse.class);
        }

        public AgentSyncResponse sync(AgentSyncRequest request)
                        throws IOException, InterruptedException {

                return post("/api/v1/sync", request, AgentSyncResponse.class);
        }

        private <T> T post(
                        String path,
                        Object requestBody,
                        Class<T> responseType)
                        throws IOException, InterruptedException {

                String body = objectMapper.writeValueAsString(requestBody);
                Duration requestTimeout = Duration.ofSeconds(
                                Math.max(1, trackingProperties.getSync().getRequestTimeoutSeconds()));

                HttpRequest request = HttpRequest.newBuilder()
                                .uri(URI.create(baseUrl() + path))
                                .timeout(requestTimeout)
                                .header("Content-Type", "application/json")
                                .header("Accept", "application/json")
                                .POST(HttpRequest.BodyPublishers.ofString(body))
                                .build();

                HttpResponse<String> response = httpClient().send(
                                request,
                                HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() < 200 || response.statusCode() >= 300) {
                        throw new IllegalStateException(
                                        "Server returned HTTP " + response.statusCode()
                                                        + " for " + path + ": " + response.body());
                }

                return objectMapper.readValue(response.body(), responseType);
        }

        private String baseUrl() {

                return trackingProperties.getServerUrl()
                                .replaceAll("/+$", "");
        }

        private HttpClient httpClient() {

                return HttpClient.newBuilder()
                                .connectTimeout(Duration.ofSeconds(
                                                Math.max(1, trackingProperties.getSync()
                                                                .getRequestTimeoutSeconds())))
                                .build();
        }
}
