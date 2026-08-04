package com.company.trackingagent.service.sync;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.trackingagent.config.TrackingProperties;
import com.company.trackingagent.dto.DeviceRegistrationRequest;
import com.company.trackingagent.dto.DeviceRegistrationResponse;
import com.company.trackingagent.entity.AgentDeviceState;
import com.company.trackingagent.repository.AgentDeviceStateRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgentDeviceStateService {

    private final AgentDeviceStateRepository agentDeviceStateRepository;
    private final AgentHttpClient agentHttpClient;
    private final TrackingProperties trackingProperties;
    private final EmployeeCodeProvider employeeCodeProvider;

    @Transactional
    public AgentDeviceState getOrCreateState() {

        return agentDeviceStateRepository
                .findById(AgentDeviceState.SINGLETON_ID)
                .orElseGet(this::createState);
    }

    @Transactional
    public AgentDeviceState ensureRegistered() {

        AgentDeviceState state = getOrCreateState();

        if (state.getServerDeviceId() != null) {
            return state;
        }

        String employeeCode = employeeCodeProvider.resolveEmployeeCodeForRegistration();

        return registerDevice(state, employeeCode);
    }

    @Transactional
    public AgentDeviceState registerOrRefreshDevice() {

        AgentDeviceState state = getOrCreateState();
        String employeeCode = employeeCodeProvider.resolveEmployeeCodeForRegistration();

        return registerDevice(state, employeeCode);
    }

    private AgentDeviceState registerDevice(
            AgentDeviceState state,
            String employeeCode) {

        DeviceRegistrationRequest request =
                new DeviceRegistrationRequest();

        request.setEmployeeCode(employeeCode);
        request.setAgentDeviceId(state.getAgentDeviceId());
        request.setHostname(resolveHostname());
        request.setOperatingSystem(System.getProperty("os.name"));
        request.setAgentVersion(trackingProperties.getAgentVersion());

        try {
            DeviceRegistrationResponse response =
                    agentHttpClient.registerDevice(request);

            if (!Boolean.TRUE.equals(response.getRegistered())
                    || response.getDeviceId() == null) {
                throw new IllegalStateException(
                        "Device registration failed");
            }

            LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

            state.setServerDeviceId(response.getDeviceId());
            if (state.getRegisteredAt() == null) {
                state.setRegisteredAt(now);
            }
            state.setUpdatedAt(now);

            AgentDeviceState savedState =
                    agentDeviceStateRepository.save(state);

            log.info("Agent device registered/refreshed with server device id {}", savedState.getServerDeviceId());

            return savedState;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(
                    "Interrupted during device registration",
                    exception);
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Device registration failed: "
                            + exception.getMessage(),
                    exception);
        }
    }

    @Transactional
    public void markSyncCompleted(AgentDeviceState state) {

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        state.setLastSyncAt(now);
        state.setUpdatedAt(now);

        agentDeviceStateRepository.save(state);
    }

    private AgentDeviceState createState() {

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        AgentDeviceState state = new AgentDeviceState();

        state.setId(AgentDeviceState.SINGLETON_ID);
        state.setAgentDeviceId(UUID.randomUUID().toString());
        state.setCreatedAt(now);
        state.setUpdatedAt(now);

        return agentDeviceStateRepository.save(state);
    }

    private String resolveHostname() {

        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (UnknownHostException exception) {
            return System.getenv().getOrDefault(
                    "COMPUTERNAME",
                    "unknown-windows-host");
        }
    }
}
