package com.company.trackingserver.controller;

import com.company.trackingserver.dto.AppCategoryRequest;
import com.company.trackingserver.dto.AppCategoryResponse;
import com.company.trackingserver.dto.CategoryRuleRequest;
import com.company.trackingserver.dto.CategoryRuleResponse;
import com.company.trackingserver.dto.ClassificationResponse;
import com.company.trackingserver.security.DeviceAuthenticationFilter;
import com.company.trackingserver.security.JwtAuthenticationFilter;
import com.company.trackingserver.service.CategoryService;
import com.company.trackingserver.service.ClassificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;







import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;


import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CategoryController.class)
@AutoConfigureMockMvc(addFilters = false)
class CategoryControllerTest {





    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CategoryService categoryService;

    @MockBean
    private ClassificationService classificationService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private DeviceAuthenticationFilter deviceAuthenticationFilter;

    @MockBean
    private UserDetailsService userDetailsService;


    private final LocalDateTime now = LocalDateTime.of(2026, 8, 4, 12, 0);


    private AppCategoryResponse categoryResponse(Long id, String name, boolean productive) {
        return new AppCategoryResponse(id, name, "#16a34a", productive, now, now);
    }

    private CategoryRuleResponse ruleResponse(Long id, Long categoryId, String matchType, String pattern) {
        return new CategoryRuleResponse(id, categoryId, "Productive", matchType, pattern, 0, true, now, now);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void listCategories_returnsCategories() throws Exception {
        when(categoryService.listCategories())
                .thenReturn(List.of(categoryResponse(1L, "Productive", true)));

        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Productive"))
                .andExpect(jsonPath("$[0].productive").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createCategory_returnsCreated() throws Exception {
        AppCategoryRequest request = new AppCategoryRequest("Neutral", "#f59e0b", false);
        when(categoryService.createCategory(any(AppCategoryRequest.class)))
                .thenReturn(categoryResponse(2L, "Neutral", false));

        mockMvc.perform(post("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.name").value("Neutral"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateCategory_returnsUpdated() throws Exception {
        AppCategoryRequest request = new AppCategoryRequest("Productive", "#16a34a", true);
        when(categoryService.updateCategory(eq(1L), any(AppCategoryRequest.class)))
                .thenReturn(categoryResponse(1L, "Productive", true));

        mockMvc.perform(put("/api/v1/categories/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteCategory_returnsNoContent() throws Exception {
        doNothing().when(categoryService).deleteCategory(1L);

        mockMvc.perform(delete("/api/v1/categories/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void listRules_returnsRules() throws Exception {
        when(categoryService.listRules())
                .thenReturn(List.of(ruleResponse(10L, 1L, "APP_NAME", "IntelliJ")));

        mockMvc.perform(get("/api/v1/categories/rules"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].matchType").value("APP_NAME"))
                .andExpect(jsonPath("$[0].pattern").value("IntelliJ"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createRule_returnsCreated() throws Exception {
        CategoryRuleRequest request = new CategoryRuleRequest(1L, "APP_NAME", "IntelliJ", 0, true);
        when(categoryService.createRule(any(CategoryRuleRequest.class)))
                .thenReturn(ruleResponse(11L, 1L, "APP_NAME", "IntelliJ"));

        mockMvc.perform(post("/api/v1/categories/rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(11));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateRule_returnsUpdated() throws Exception {
        CategoryRuleRequest request = new CategoryRuleRequest(1L, "APP_NAME", "IntelliJ", 0, true);
        when(categoryService.updateRule(eq(11L), any(CategoryRuleRequest.class)))
                .thenReturn(ruleResponse(11L, 1L, "APP_NAME", "IntelliJ"));

        mockMvc.perform(put("/api/v1/categories/rules/11")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(11));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteRule_returnsNoContent() throws Exception {
        doNothing().when(categoryService).deleteRule(11L);

        mockMvc.perform(delete("/api/v1/categories/rules/11"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void classify_returnsClassification() throws Exception {
        when(classificationService.classify("IntelliJ IDEA", "Project - IntelliJ IDEA"))
                .thenReturn(new ClassificationResponse(1L, "Productive", true, "APP_NAME", "IntelliJ"));

        mockMvc.perform(get("/api/v1/categories/classify")
                        .param("appName", "IntelliJ IDEA")
                        .param("windowTitle", "Project - IntelliJ IDEA"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryName").value("Productive"))
                .andExpect(jsonPath("$.productive").value(true));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void listCategories_allowsManager() throws Exception {
        when(categoryService.listCategories()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk());
    }

}


