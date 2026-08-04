package com.company.trackingserver.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.trackingserver.dto.AgentSyncRequest;
import com.company.trackingserver.dto.AgentSyncResponse;
import com.company.trackingserver.service.AgentSyncService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/sync")
@RequiredArgsConstructor
public class AgentSyncController {

    private final AgentSyncService agentSyncService;

    @PostMapping
    public AgentSyncResponse sync(
            @Valid @RequestBody AgentSyncRequest request) {

        return agentSyncService.sync(request);
    }
}
