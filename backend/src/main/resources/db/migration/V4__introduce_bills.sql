-- V4: Promote "bill" to a first-class aggregate (Stage 4 redesign).
--
-- A sale or import is now ONE bill containing 1+ product lines. The
-- transactions table keeps its name but its rows are bill lines linked
-- by bill_id. Idempotency, atomicity, and reversal all move from
-- per-line to per-bill: the BillService writes the whole bill in one
-- DB transaction.
--
-- No data preservation: development pre-data, per CLAUDE.md.

DROP TABLE IF EXISTS transactions;

-- The PG enum is reused as the bill type. Hibernate's
-- @JdbcTypeCode(SqlTypes.NAMED_ENUM) maps a Java enum named `BillType`
-- to a PG type named `billtype`.
ALTER TYPE transactiontype RENAME TO billtype;

CREATE TABLE bills (
    id                       BIGSERIAL    PRIMARY KEY,
    type                     billtype     NOT NULL,
    party_name               VARCHAR(200) NULL,
    occurred_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    idempotency_key          UUID         NOT NULL UNIQUE,
    correction_of_bill_id    BIGINT       NULL REFERENCES bills (id),
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_bills_type_occurred_at ON bills (type, occurred_at DESC);

CREATE TABLE transactions (
    id                       BIGSERIAL    PRIMARY KEY,
    bill_id                  BIGINT       NOT NULL REFERENCES bills (id) ON DELETE RESTRICT,
    product_id               BIGINT       NOT NULL REFERENCES products (id),
    quantity                 INTEGER      NOT NULL,
    unit_price               BIGINT       NOT NULL CHECK (unit_price >= 0),
    cost_basis_per_unit      BIGINT       NULL     CHECK (cost_basis_per_unit IS NULL OR cost_basis_per_unit >= 0),
    total                    BIGINT       GENERATED ALWAYS AS (unit_price * quantity) STORED,
    note                     TEXT         NULL,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- SALE lines must have cost_basis_per_unit; IMPORT lines must not.
-- Enforced by BillService (we can't easily express bill.type from
-- transactions in a CHECK without a trigger or function).

CREATE INDEX idx_transactions_bill_id    ON transactions (bill_id);
CREATE INDEX idx_transactions_product_id ON transactions (product_id);
