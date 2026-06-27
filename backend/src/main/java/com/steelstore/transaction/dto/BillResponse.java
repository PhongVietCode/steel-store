package com.steelstore.transaction.dto;

import com.steelstore.transaction.Bill;
import com.steelstore.transaction.BillType;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record BillResponse(
        Long id,
        BillType type,
        String partyName,
        OffsetDateTime occurredAt,
        UUID idempotencyKey,
        Long correctionOfBillId,
        Long reversedByBillId,
        OffsetDateTime createdAt,
        long total,
        List<BillLineResponse> lines
) {
    public static BillResponse from(Bill bill, Long reversedByBillId) {
        List<BillLineResponse> lineDtos = bill.getLines().stream()
                .map(BillLineResponse::from)
                .toList();
        long total = lineDtos.stream().mapToLong(BillLineResponse::total).sum();
        return new BillResponse(
                bill.getId(),
                bill.getType(),
                bill.getPartyName(),
                bill.getOccurredAt(),
                bill.getIdempotencyKey(),
                bill.getCorrectionOfBill() == null ? null : bill.getCorrectionOfBill().getId(),
                reversedByBillId,
                bill.getCreatedAt(),
                total,
                lineDtos
        );
    }
}
