package com.steelstore.report;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

/**
 * Read-only aggregation over SALE bill lines. Counter-bill lines have a
 * signed-negative quantity, so they net out naturally in SUM(quantity * ...).
 * Type and occurred_at live on the parent {@code bills} row.
 */
public interface ProfitReportRepository extends Repository<com.steelstore.transaction.Transaction, Long> {

    @Query("""
        SELECT t.product.id           AS productId,
               t.product.name         AS name,
               SUM(t.quantity)        AS qtySold,
               SUM(t.unitPrice          * t.quantity) AS revenue,
               SUM(t.costBasisPerUnit   * t.quantity) AS cost
        FROM Transaction t
        WHERE t.bill.type = com.steelstore.transaction.BillType.SALE
          AND t.bill.occurredAt >= :from
          AND t.bill.occurredAt <  :to
        GROUP BY t.product.id, t.product.name
        ORDER BY t.product.name ASC
        """)
    List<ProductProfitProjection> aggregateSales(
            @Param("from") OffsetDateTime from,
            @Param("to")   OffsetDateTime to);

    /**
     * Daily revenue / cost over SALE bill lines, grouped by the local date
     * in Asia/Ho_Chi_Minh. Native because date-trunc-with-timezone isn't
     * portable across JPA dialects.
     */
    @Query(value = """
        SELECT (b.occurred_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day,
               SUM(t.unit_price        * t.quantity)                  AS revenue,
               SUM(t.cost_basis_per_unit * t.quantity)                AS cost
        FROM transactions t
        JOIN bills b ON b.id = t.bill_id
        WHERE b.type = 'SALE'
          AND b.occurred_at >= :from
          AND b.occurred_at <  :to
        GROUP BY day
        ORDER BY day ASC
        """, nativeQuery = true)
    List<DailyProfitProjection> aggregateDaily(
            @Param("from") OffsetDateTime from,
            @Param("to")   OffsetDateTime to);
}
