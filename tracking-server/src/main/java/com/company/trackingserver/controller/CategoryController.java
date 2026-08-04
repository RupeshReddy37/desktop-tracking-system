package com.company.trackingserver.controller;

import com.company.trackingserver.dto.AppCategoryRequest;
import com.company.trackingserver.dto.AppCategoryResponse;
import com.company.trackingserver.dto.CategoryRuleRequest;
import com.company.trackingserver.dto.CategoryRuleResponse;
import com.company.trackingserver.dto.ClassificationResponse;
import com.company.trackingserver.service.CategoryService;
import com.company.trackingserver.service.ClassificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final ClassificationService classificationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<AppCategoryResponse> listCategories() {
        return categoryService.listCategories();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public AppCategoryResponse createCategory(@Valid @RequestBody AppCategoryRequest request) {
        return categoryService.createCategory(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AppCategoryResponse updateCategory(@PathVariable Long id,
                                              @Valid @RequestBody AppCategoryRequest request) {
        return categoryService.updateCategory(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
    }

    @GetMapping("/rules")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<CategoryRuleResponse> listRules() {
        return categoryService.listRules();
    }

    @PostMapping("/rules")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryRuleResponse createRule(@Valid @RequestBody CategoryRuleRequest request) {
        return categoryService.createRule(request);
    }

    @PutMapping("/rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryRuleResponse updateRule(@PathVariable Long id,
                                           @Valid @RequestBody CategoryRuleRequest request) {
        return categoryService.updateRule(id, request);
    }

    @DeleteMapping("/rules/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteRule(@PathVariable Long id) {
        categoryService.deleteRule(id);
    }

    @GetMapping("/classify")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ClassificationResponse classify(@RequestParam(required = false) String appName,
                                           @RequestParam(required = false) String windowTitle) {
        return classificationService.classify(appName, windowTitle);
    }
}
