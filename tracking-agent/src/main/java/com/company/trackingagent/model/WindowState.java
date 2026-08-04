package com.company.trackingagent.model;

import java.time.LocalDateTime;

import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
public class WindowState {

    private String currentWindowTitle;

    private LocalDateTime windowChangedAt;
}