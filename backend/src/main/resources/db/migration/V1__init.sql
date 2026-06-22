-- Steel Store — initial schema (Stage 1)
-- VND amounts are stored as BIGINT (whole đồng — no fractional unit).

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(64) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
    id                      BIGSERIAL PRIMARY KEY,
    name                    VARCHAR(255) NOT NULL,
    unit                    VARCHAR(32)  NOT NULL,
    current_import_price    BIGINT       NOT NULL DEFAULT 0 CHECK (current_import_price  >= 0),
    current_selling_price   BIGINT       NOT NULL DEFAULT 0 CHECK (current_selling_price >= 0),
    current_stock           INTEGER      NOT NULL DEFAULT 0 CHECK (current_stock         >= 0),
    latest_import_date      DATE         NULL,
    version                 BIGINT       NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_name ON products (lower(name));

CREATE TYPE transaction_type AS ENUM ('IMPORT', 'SALE');

CREATE TABLE transactions (
    id                      BIGSERIAL PRIMARY KEY,
    type                    transaction_type NOT NULL,
    product_id              BIGINT       NOT NULL REFERENCES products (id),
    quantity                INTEGER      NOT NULL,
    unit_price              BIGINT       NOT NULL CHECK (unit_price >= 0),
    cost_basis_per_unit     BIGINT       NULL     CHECK (cost_basis_per_unit IS NULL OR cost_basis_per_unit >= 0),
    total                   BIGINT       GENERATED ALWAYS AS (unit_price * quantity) STORED,
    occurred_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    idempotency_key         UUID         NOT NULL UNIQUE,
    correction_of_id        BIGINT       NULL REFERENCES transactions (id),
    note                    TEXT         NULL,
    CONSTRAINT chk_sale_has_cost_basis
        CHECK (type <> 'SALE' OR cost_basis_per_unit IS NOT NULL)
);

CREATE INDEX idx_transactions_occurred_at      ON transactions (occurred_at);
CREATE INDEX idx_transactions_type_occurred_at ON transactions (type, occurred_at);
CREATE INDEX idx_transactions_product_id       ON transactions (product_id);
