package com.steelstore.product.dto;

import com.steelstore.product.Product;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ProductResponse(
        Long id,
        String name,
        String unit,
        long currentImportPrice,
        long currentSellingPrice,
        int currentStock,
        LocalDate latestImportDate,
        long version,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ProductResponse from(Product p) {
        return new ProductResponse(
                p.getId(),
                p.getName(),
                p.getUnit(),
                p.getCurrentImportPrice(),
                p.getCurrentSellingPrice(),
                p.getCurrentStock(),
                p.getLatestImportDate(),
                p.getVersion(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
