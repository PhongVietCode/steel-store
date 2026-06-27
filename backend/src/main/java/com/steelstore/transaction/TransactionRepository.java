package com.steelstore.transaction;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Plain JPA repository for bill lines. The aggregate root for writes is
 * {@link BillRepository}; this repo exists for the few read-paths that
 * touch lines directly (profit report, ad-hoc queries in tests).
 */
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
}
