package com.steelstore.transaction.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record BillLineRequest(
        @NotNull Long productId,
        @Positive int quantity,
        @PositiveOrZero long unitPrice,
        String note
) {}
