package com.company.trackingserver.repository;

import com.company.trackingserver.entity.CategoryRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRuleRepository
        extends JpaRepository<CategoryRule, Long> {

    List<CategoryRule> findAllByOrderByPriorityAscIdAsc();

    List<CategoryRule> findByEnabledTrueOrderByPriorityAscIdAsc();

    List<CategoryRule> findByCategoryIdOrderByPriorityAscIdAsc(Long categoryId);

    void deleteByCategoryId(Long categoryId);
}
