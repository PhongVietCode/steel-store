package com.steelstore.transaction.dto;

import com.steelstore.transaction.Transaction;
import com.steelstore.transaction.TransactionType;
import java.time.OffsetDateTime;
import java.util.UUID;

public record TransactionResponse(
        Long id,
        TransactionType type,
        Long productId,
        String productName,
        int quantity,
        long unitPrice,
        Long costBasisPerUnit,
        long total,
        OffsetDateTime occurredAt,
        UUID idempotencyKey,
        Long correctionOfId,
        String note
) {
    public static TransactionResponse from(Transaction t) {
        return new TransactionResponse(
                t.getId(),
                t.getType(),
                t.getProduct().getId(),
                t.getProduct().getName(),
                t.getQuantity(),
                t.getUnitPrice(),
                t.getCostBasisPerUnit(),
                t.getTotal(),
                t.getOccurredAt(),
                t.getIdempotencyKey(),
                t.getCorrectionOf() == null ? null : t.getCorrectionOf().getId(),
                t.getNote()
        );
    }
}
