package com.steelstore.report;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

/**
 * Read-only aggregation over SALE rows. Corrections (signed negative
 * quantity) net out naturally because the SUMs use `t.quantity` directly.
 */
public interface ProfitReportRepository extends Repository<com.steelstore.transaction.Transaction, Long> {

    @Query("""
        SELECT t.product.id           AS productId,
               t.product.name         AS name,
               SUM(t.quantity)        AS qtySold,
               SUM(t.unitPrice          * t.quantity) AS revenue,
               SUM(t.costBasisPerUnit   * t.quantity) AS cost
        FROM Transaction t
        WHERE t.type = com.steelstore.transaction.TransactionType.SALE
          AND t.occurredAt >= :from
          AND t.occurredAt <  :to
        GROUP BY t.product.id, t.product.name
        ORDER BY t.product.name ASC
        """)
    List<ProductProfitProjection> aggregateSales(
            @Param("from") OffsetDateTime from,
            @Param("to")   OffsetDateTime to);

    /**
     * Daily revenue / cost over SALE rows, grouped by the local date in
     * Asia/Ho_Chi_Minh. Native because date-trunc-with-timezone isn't
     * portable across JPA dialects.
     */
    @Query(value = """
        SELECT (occurred_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day,
               SUM(unit_price        * quantity)                    AS revenue,
               SUM(cost_basis_per_unit * quantity)                  AS cost
        FROM transactions
        WHERE type = 'SALE'
          AND occurred_at >= :from
          AND occurred_at <  :to
        GROUP BY day
        ORDER BY day ASC
        """, nativeQuery = true)
    List<DailyProfitProjection> aggregateDaily(
            @Param("from") OffsetDateTime from,
            @Param("to")   OffsetDateTime to);
}
