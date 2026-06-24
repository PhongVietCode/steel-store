package com.steelstore.transaction;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByIdempotencyKey(UUID idempotencyKey);

    @Query("""
        SELECT t FROM Transaction t
        WHERE (:productId IS NULL OR t.product.id = :productId)
          AND (:type      IS NULL OR t.type       = :type)
          AND (:from      IS NULL OR t.occurredAt >= :from)
          AND (:to        IS NULL OR t.occurredAt <  :to)
        ORDER BY t.occurredAt DESC, t.id DESC
        """)
    Page<Transaction> search(
            @Param("productId") Long productId,
            @Param("type") TransactionType type,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to,
            Pageable pageable);
}
