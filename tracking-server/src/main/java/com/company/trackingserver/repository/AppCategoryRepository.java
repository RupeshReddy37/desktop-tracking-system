package com.company.trackingserver.repository;

import com.company.trackingserver.entity.AppCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AppCategoryRepository
        extends JpaRepository<AppCategory, Long> {

    Optional<AppCategory> findByNameIgnoreCase(String name);

    List<AppCategory> findAllByOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);
}
