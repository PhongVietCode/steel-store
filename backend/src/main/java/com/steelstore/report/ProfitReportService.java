package com.steelstore.report;

import com.steelstore.report.dto.DailyProfitRow;
import com.steelstore.report.dto.ProductProfitRow;
import com.steelstore.report.dto.ProfitReportResponse;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfitReportService {

    /** Date-range queries are interpreted in this zone (Vietnam business). */
    public static final ZoneId REPORT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ProfitReportRepository repository;

    public ProfitReportService(ProfitReportRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public ProfitReportResponse profit(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("'from' must be on or before 'to'");
        }
        OffsetDateTime start = from.atStartOfDay(REPORT_ZONE).toOffsetDateTime();
        OffsetDateTime endExclusive = to.plusDays(1).atStartOfDay(REPORT_ZONE).toOffsetDateTime();

        List<ProductProfitRow> rows = repository.aggregateSales(start, endExclusive).stream()
                .map(p -> {
                    long qty = nz(p.getQtySold());
                    long revenue = nz(p.getRevenue());
                    long cost = nz(p.getCost());
                    return new ProductProfitRow(
                            p.getProductId(), p.getName(),
                            qty, revenue, cost, revenue - cost);
                })
                .toList();

        List<DailyProfitRow> daily = repository.aggregateDaily(start, endExclusive).stream()
                .map(d -> {
                    long revenue = nz(d.getRevenue());
                    long cost = nz(d.getCost());
                    return new DailyProfitRow(d.getDay(), revenue, cost, revenue - cost);
                })
                .toList();

        long totalRevenue = rows.stream().mapToLong(ProductProfitRow::revenue).sum();
        long totalCost    = rows.stream().mapToLong(ProductProfitRow::cost).sum();
        return new ProfitReportResponse(from, to, totalRevenue, totalCost,
                totalRevenue - totalCost, rows, daily);
    }

    private static long nz(Long v) { return v == null ? 0L : v; }
}
