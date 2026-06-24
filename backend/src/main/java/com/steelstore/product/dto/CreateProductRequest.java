package com.steelstore.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CreateProductRequest(
        @NotBlank @Size(max = 255) String name,
        @NotBlank @Size(max = 32)  String unit,
        @PositiveOrZero long currentImportPrice,
        @PositiveOrZero long currentSellingPrice,
        @PositiveOrZero int  currentStock
) {}
