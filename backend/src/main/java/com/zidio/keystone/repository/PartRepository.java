package com.zidio.keystone.repository;

import com.zidio.keystone.domain.Part;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PartRepository extends JpaRepository<Part, Long> {
    boolean existsBySkuIgnoreCase(String sku);
}
