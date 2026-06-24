package com.steelstore.report.dto;

import java.time.LocalDate;
import java.util.List;

public record ProfitReportResponse(
        LocalDate from,
        LocalDate to,
        long revenue,
        long cost,
        long profit,
        List<ProductProfitRow> byProduct
) {}
