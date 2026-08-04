package com.company.trackingserver.service;

import com.company.trackingserver.dto.ClassificationResponse;
import com.company.trackingserver.entity.CategoryRule;
import com.company.trackingserver.repository.CategoryRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ClassificationService {

    private final CategoryRuleRepository categoryRuleRepository;

    /**
     * Classifies a raw (applicationName, windowTitle) pair into a category using
     * the ordered set of enabled rules. Rules are evaluated by priority (ascending),
     * first match wins. Returns null when no rule matches.
     */
    public ClassificationResponse classify(String applicationName, String windowTitle) {
        List<CategoryRule> rules = categoryRuleRepository.findByEnabledTrueOrderByPriorityAscIdAsc();
        String app = normalize(applicationName);
        String title = normalize(windowTitle);

        for (CategoryRule rule : rules) {
            if (matches(rule, app, title)) {
                return new ClassificationResponse(
                        rule.getCategory().getId(),
                        rule.getCategory().getName(),
                        rule.getCategory().getProductive(),
                        rule.getMatchType(),
                        rule.getPattern());
            }
        }
        return null;
    }

    private boolean matches(CategoryRule rule, String app, String title) {
        String pattern = normalize(rule.getPattern());
        if (pattern.isEmpty()) {
            return false;
        }
        return switch (rule.getMatchType()) {
            case "APP_NAME" -> app.contains(pattern);
            case "WINDOW_TITLE" -> title.contains(pattern);
            case "URL_DOMAIN" -> title.contains(pattern);
            default -> false;
        };
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).trim();
    }
}
