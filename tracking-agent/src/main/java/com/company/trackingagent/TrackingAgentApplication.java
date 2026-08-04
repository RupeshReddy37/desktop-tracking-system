package com.company.trackingagent;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;
import com.company.trackingagent.service.TrackerService;
import com.company.trackingagent.config.TrackingProperties;
import org.springframework.boot.CommandLineRunner;

@EnableScheduling
@EnableConfigurationProperties(TrackingProperties.class)
@SpringBootApplication
public class TrackingAgentApplication implements CommandLineRunner {

	private final TrackerService trackerService;

	public TrackingAgentApplication(TrackerService trackerService){
		this.trackerService = trackerService;
	}
	public static void main(String[] args) {
		SpringApplication.run(TrackingAgentApplication.class, args);
	}

	@Override
	public void run(String... args){
		trackerService.start();
	}

}

// $env:TRACKING_EMPLOYEE_CODE="EMP001"
// .\mvnw.cmd spring-boot:run