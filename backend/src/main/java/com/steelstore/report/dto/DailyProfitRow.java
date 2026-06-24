package com.steelstore.report.dto;

import java.time.LocalDate;

public record DailyProfitRow(
        LocalDate date,
        long revenue,
        long cost,
        long profit
) {}
