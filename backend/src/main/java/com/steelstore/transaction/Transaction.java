package com.steelstore.transaction;

import com.steelstore.product.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.generator.EventType;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "type", nullable = false, columnDefinition = "transactiontype")
    private TransactionType type;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false)
    private long unitPrice;

    @Column(name = "cost_basis_per_unit")
    private Long costBasisPerUnit;

    @Generated(event = EventType.INSERT)
    @Column(name = "total", insertable = false, updatable = false)
    private long total;

    @Column(name = "occurred_at", nullable = false)
    private OffsetDateTime occurredAt;

    @Column(name = "idempotency_key", nullable = false, unique = true)
    private UUID idempotencyKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "correction_of_id")
    private Transaction correctionOf;

    @Column(name = "note")
    private String note;

    protected Transaction() {}

    public Transaction(TransactionType type, Product product, int quantity, long unitPrice,
                       Long costBasisPerUnit, UUID idempotencyKey,
                       Transaction correctionOf, String note) {
        this.type = type;
        this.product = product;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.costBasisPerUnit = costBasisPerUnit;
        this.idempotencyKey = idempotencyKey;
        this.correctionOf = correctionOf;
        this.note = note;
    }

    @PrePersist
    void onCreate() {
        if (occurredAt == null) {
            occurredAt = OffsetDateTime.now();
        }
    }

    public Long getId() { return id; }
    public TransactionType getType() { return type; }
    public Product getProduct() { return product; }
    public int getQuantity() { return quantity; }
    public long getUnitPrice() { return unitPrice; }
    public Long getCostBasisPerUnit() { return costBasisPerUnit; }
    public long getTotal() { return total; }
    public OffsetDateTime getOccurredAt() { return occurredAt; }
    public UUID getIdempotencyKey() { return idempotencyKey; }
    public Transaction getCorrectionOf() { return correctionOf; }
    public String getNote() { return note; }
}
