package com.steelstore.product;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByNameContainingIgnoreCaseOrderByNameAsc(String namePart);
    List<Product> findAllByOrderByNameAsc();
}
