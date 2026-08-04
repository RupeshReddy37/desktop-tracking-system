package com.company.trackingserver.service;

import com.company.trackingserver.dto.AppCategoryRequest;
import com.company.trackingserver.dto.AppCategoryResponse;
import com.company.trackingserver.dto.CategoryRuleRequest;
import com.company.trackingserver.dto.CategoryRuleResponse;
import com.company.trackingserver.entity.AppCategory;
import com.company.trackingserver.entity.CategoryRule;
import com.company.trackingserver.repository.AppCategoryRepository;
import com.company.trackingserver.repository.CategoryRuleRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final AppCategoryRepository appCategoryRepository;
    private final CategoryRuleRepository categoryRuleRepository;

    @PostConstruct
    public void seedDefaults() {
        if (appCategoryRepository.count() > 0) {
            return;
        }
        seedCategory("Productive", "#16a34a", true, List.of(
                rule("APP_NAME", "IntelliJ"),
                rule("APP_NAME", "idea64"),
                rule("APP_NAME", "Visual Studio Code"),
                rule("APP_NAME", "Code"),
                rule("APP_NAME", "Eclipse"),
                rule("APP_NAME", "Postman"),
                rule("APP_NAME", "Docker"),
                rule("APP_NAME", "Microsoft Word"),
                rule("APP_NAME", "WINWORD"),
                rule("APP_NAME", "Microsoft Excel"),
                rule("APP_NAME", "EXCEL"),
                rule("APP_NAME", "Microsoft PowerPoint"),
                rule("APP_NAME", "POWERPNT"),
                rule("APP_NAME", "Jira"),
                rule("APP_NAME", "Asana"),
                rule("APP_NAME", "Trello"),
                rule("APP_NAME", "GitHub"),
                rule("APP_NAME", "GitLab"),
                rule("APP_NAME", "Slack")));
        seedCategory("Neutral", "#f59e0b", false, List.of(
                rule("APP_NAME", "Outlook"),
                rule("APP_NAME", "OUTLOOK"),
                rule("APP_NAME", "Gmail"),
                rule("APP_NAME", "Microsoft Teams"),
                rule("APP_NAME", "Teams"),
                rule("APP_NAME", "Calendar"),
                rule("APP_NAME", "Zoom"),
                rule("APP_NAME", "Webex"),
                rule("APP_NAME", "Notepad"),
                rule("APP_NAME", "File Explorer"),
                rule("APP_NAME", "explorer")));
        seedCategory("Unproductive", "#dc2626", false, List.of(
                rule("APP_NAME", "Facebook"),
                rule("APP_NAME", "Instagram"),
                rule("APP_NAME", "Twitter"),
                rule("APP_NAME", "X"),
                rule("APP_NAME", "Reddit"),
                rule("APP_NAME", "TikTok"),
                rule("APP_NAME", "Netflix"),
                rule("APP_NAME", "YouTube"),
                rule("APP_NAME", "Twitch"),
                rule("APP_NAME", "Steam"),
                rule("APP_NAME", "Epic Games"),
                rule("APP_NAME", "Amazon"),
                rule("APP_NAME", "Flipkart"),
                rule("APP_NAME", "WhatsApp")));
    }

    private void seedCategory(String name, String color, boolean productive, List<CategoryRule> rules) {
        AppCategory category = new AppCategory();
        category.setName(name);
        category.setColor(color);
        category.setProductive(productive);
        category.setCreatedAt(LocalDateTime.now());
        category.setUpdatedAt(LocalDateTime.now());
        appCategoryRepository.save(category);
        rules.forEach(rule -> {
            rule.setCategory(category);
            rule.setCreatedAt(LocalDateTime.now());
            rule.setUpdatedAt(LocalDateTime.now());
            categoryRuleRepository.save(rule);
        });
    }

    private CategoryRule rule(String matchType, String pattern) {
        CategoryRule rule = new CategoryRule();
        rule.setMatchType(matchType);
        rule.setPattern(pattern);
        rule.setPriority(0);
        rule.setEnabled(true);
        return rule;
    }

    @Transactional(readOnly = true)
    public List<AppCategoryResponse> listCategories() {
        return appCategoryRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::toCategoryResponse)
                .toList();
    }

    @Transactional
    public AppCategoryResponse createCategory(AppCategoryRequest request) {
        if (appCategoryRepository.existsByNameIgnoreCase(request.name())) {
            throw new IllegalArgumentException("Category already exists: " + request.name());
        }
        AppCategory category = new AppCategory();
        category.setName(request.name().trim());
        category.setColor(request.color());
        category.setProductive(request.productive());
        category.setCreatedAt(LocalDateTime.now());
        category.setUpdatedAt(LocalDateTime.now());
        return toCategoryResponse(appCategoryRepository.save(category));
    }

    @Transactional
    public AppCategoryResponse updateCategory(Long id, AppCategoryRequest request) {
        AppCategory category = appCategoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));
        category.setName(request.name().trim());
        category.setColor(request.color());
        category.setProductive(request.productive());
        category.setUpdatedAt(LocalDateTime.now());
        return toCategoryResponse(appCategoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Long id) {
        AppCategory category = appCategoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));
        categoryRuleRepository.deleteByCategoryId(id);
        appCategoryRepository.delete(category);
    }

    @Transactional(readOnly = true)
    public List<CategoryRuleResponse> listRules() {
        return categoryRuleRepository.findAllByOrderByPriorityAscIdAsc()
                .stream()
                .map(this::toRuleResponse)
                .toList();
    }

    @Transactional
    public CategoryRuleResponse createRule(CategoryRuleRequest request) {
        AppCategory category = appCategoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + request.categoryId()));
        CategoryRule rule = new CategoryRule();
        rule.setCategory(category);
        rule.setMatchType(request.matchType().trim().toUpperCase());
        rule.setPattern(request.pattern().trim());
        rule.setPriority(request.priority() == null ? 0 : request.priority());
        rule.setEnabled(request.enabled() == null || request.enabled());
        rule.setCreatedAt(LocalDateTime.now());
        rule.setUpdatedAt(LocalDateTime.now());
        return toRuleResponse(categoryRuleRepository.save(rule));
    }

    @Transactional
    public CategoryRuleResponse updateRule(Long id, CategoryRuleRequest request) {
        CategoryRule rule = categoryRuleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rule not found: " + id));
        AppCategory category = appCategoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + request.categoryId()));
        rule.setCategory(category);
        rule.setMatchType(request.matchType().trim().toUpperCase());
        rule.setPattern(request.pattern().trim());
        rule.setPriority(request.priority() == null ? 0 : request.priority());
        rule.setEnabled(request.enabled() == null || request.enabled());
        rule.setUpdatedAt(LocalDateTime.now());
        return toRuleResponse(categoryRuleRepository.save(rule));
    }

    @Transactional
    public void deleteRule(Long id) {
        categoryRuleRepository.deleteById(id);
    }

    private AppCategoryResponse toCategoryResponse(AppCategory category) {
        return new AppCategoryResponse(
                category.getId(),
                category.getName(),
                category.getColor(),
                category.getProductive(),
                category.getCreatedAt(),
                category.getUpdatedAt());
    }

    private CategoryRuleResponse toRuleResponse(CategoryRule rule) {
        return new CategoryRuleResponse(
                rule.getId(),
                rule.getCategory().getId(),
                rule.getCategory().getName(),
                rule.getMatchType(),
                rule.getPattern(),
                rule.getPriority(),
                rule.getEnabled(),
                rule.getCreatedAt(),
                rule.getUpdatedAt());
    }
}
