package com.steelstore.transaction.dto;

import com.steelstore.transaction.Transaction;

public record BillLineResponse(
        Long id,
        Long productId,
        String productName,
        String productUnit,
        int quantity,
        long unitPrice,
        Long costBasisPerUnit,
        long total,
        String note
) {
    public static BillLineResponse from(Transaction t) {
        return new BillLineResponse(
                t.getId(),
                t.getProduct().getId(),
                t.getProduct().getName(),
                t.getProduct().getUnit(),
                t.getQuantity(),
                t.getUnitPrice(),
                t.getCostBasisPerUnit(),
                t.getTotal(),
                t.getNote()
        );
    }
}
