package com.steelstore.report.dto;

public record ProductProfitRow(
        Long productId,
        String name,
        long qtySold,
        long revenue,
        long cost,
        long profit
) {}
