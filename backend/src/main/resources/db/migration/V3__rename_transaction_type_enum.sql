-- Hibernate 7's @JdbcTypeCode(SqlTypes.NAMED_ENUM) casts to a type name
-- derived from the Java enum's simple name, lowercased: `transactiontype`.
-- V1 created the type as `transaction_type`. Rename so JPQL `t.type = ...`
-- comparisons resolve cleanly.

ALTER TYPE transaction_type RENAME TO transactiontype;
