package com.company.trackingserver.service;

import com.company.trackingserver.dto.ClassificationResponse;
import com.company.trackingserver.entity.AppCategory;
import com.company.trackingserver.entity.CategoryRule;
import com.company.trackingserver.repository.CategoryRuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClassificationServiceTest {

    @Mock
    private CategoryRuleRepository categoryRuleRepository;

    private ClassificationService classificationService;

    private AppCategory productive;
    private AppCategory unproductive;

    @BeforeEach
    void setUp() {
        classificationService = new ClassificationService(categoryRuleRepository);

        productive = new AppCategory();
        productive.setId(1L);
        productive.setName("Productive");
        productive.setProductive(true);

        unproductive = new AppCategory();
        unproductive.setId(2L);
        unproductive.setName("Unproductive");
        unproductive.setProductive(false);
    }

    private CategoryRule rule(AppCategory category, String matchType, String pattern, int priority) {
        CategoryRule rule = new CategoryRule();
        rule.setCategory(category);
        rule.setMatchType(matchType);
        rule.setPattern(pattern);
        rule.setPriority(priority);
        rule.setEnabled(true);
        return rule;
    }

    @Test
    void classify_matchesAppName() {
        when(categoryRuleRepository.findByEnabledTrueOrderByPriorityAscIdAsc())
                .thenReturn(List.of(rule(productive, "APP_NAME", "IntelliJ", 0)));

        ClassificationResponse result = classificationService.classify("IntelliJ IDEA", "Project - IntelliJ IDEA");

        assertThat(result).isNotNull();
        assertThat(result.categoryName()).isEqualTo("Productive");
        assertThat(result.productive()).isTrue();
        assertThat(result.matchType()).isEqualTo("APP_NAME");
    }

    @Test
    void classify_matchesWindowTitle() {
        when(categoryRuleRepository.findByEnabledTrueOrderByPriorityAscIdAsc())
                .thenReturn(List.of(rule(unproductive, "WINDOW_TITLE", "youtube", 0)));

        ClassificationResponse result = classificationService.classify("Google Chrome", "YouTube - Google Chrome");

        assertThat(result).isNotNull();
        assertThat(result.categoryName()).isEqualTo("Unproductive");
        assertThat(result.productive()).isFalse();
    }

    @Test
    void classify_matchesUrlDomainAgainstWindowTitle() {
        when(categoryRuleRepository.findByEnabledTrueOrderByPriorityAscIdAsc())
                .thenReturn(List.of(rule(unproductive, "URL_DOMAIN", "youtube.com", 0)));

        ClassificationResponse result = classificationService.classify("Google Chrome", "YouTube - youtube.com");

        assertThat(result).isNotNull();
        assertThat(result.categoryName()).isEqualTo("Unproductive");
        assertThat(result.matchType()).isEqualTo("URL_DOMAIN");
    }

    @Test
    void classify_isCaseInsensitiveAndTrims() {
        when(categoryRuleRepository.findByEnabledTrueOrderByPriorityAscIdAsc())
                .thenReturn(List.of(rule(productive, "APP_NAME", "  visual studio code  ", 0)));

        ClassificationResponse result = classificationService.classify("VISUAL STUDIO CODE", "app.js - Visual Studio Code");

        assertThat(result).isNotNull();
        assertThat(result.categoryName()).isEqualTo("Productive");
    }

    @Test
    void classify_firstMatchByPriorityWins() {
        when(categoryRuleRepository.findByEnabledTrueOrderByPriorityAscIdAsc())
                .thenReturn(List.of(
                        rule(unproductive, "APP_NAME", "Chrome", 0),
                        rule(productive, "APP_NAME", "Chrome", 1)));

        ClassificationResponse result = classificationService.classify("Google Chrome", "Gmail - Google Chrome");

        assertThat(result).isNotNull();
        assertThat(result.categoryName()).isEqualTo("Unproductive");
    }

    @Test
    void classify_returnsNullWhenNoRuleMatches() {
        when(categoryRuleRepository.findByEnabledTrueOrderByPriorityAscIdAsc())
                .thenReturn(List.of(rule(productive, "APP_NAME", "IntelliJ", 0)));

        ClassificationResponse result = classificationService.classify("Notepad", "notes.txt - Notepad");

        assertThat(result).isNull();
    }

    @Test
    void classify_returnsNullForNullInputs() {
        when(categoryRuleRepository.findByEnabledTrueOrderByPriorityAscIdAsc())
                .thenReturn(List.of(rule(productive, "APP_NAME", "IntelliJ", 0)));

        ClassificationResponse result = classificationService.classify(null, null);

        assertThat(result).isNull();
    }

    @Test
    void classify_ignoresEmptyPattern() {
        when(categoryRuleRepository.findByEnabledTrueOrderByPriorityAscIdAsc())
                .thenReturn(List.of(rule(productive, "APP_NAME", "   ", 0)));

        ClassificationResponse result = classificationService.classify("IntelliJ IDEA", "Project - IntelliJ IDEA");

        assertThat(result).isNull();
    }
}
