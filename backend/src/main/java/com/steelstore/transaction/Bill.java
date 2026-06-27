package com.steelstore.transaction;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Aggregate root for a sale or import. Holds 1+ {@link Transaction} lines,
 * one per product. Idempotency, reversal, and atomicity are bill-scoped:
 * the whole bill writes or rolls back in one DB transaction.
 */
@Entity
@Table(name = "bills")
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "type", nullable = false, columnDefinition = "billtype")
    private BillType type;

    @Column(name = "party_name", length = 200)
    private String partyName;

    @Column(name = "occurred_at", nullable = false)
    private OffsetDateTime occurredAt;

    @Column(name = "idempotency_key", nullable = false, unique = true)
    private UUID idempotencyKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "correction_of_bill_id")
    private Bill correctionOfBill;

    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL,
            orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Transaction> lines = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
    private OffsetDateTime createdAt;

    protected Bill() {}

    public Bill(BillType type, String partyName, OffsetDateTime occurredAt,
                UUID idempotencyKey, Bill correctionOfBill) {
        this.type = type;
        this.partyName = partyName;
        this.occurredAt = occurredAt;
        this.idempotencyKey = idempotencyKey;
        this.correctionOfBill = correctionOfBill;
    }

    @PrePersist
    void onCreate() {
        if (occurredAt == null) {
            occurredAt = OffsetDateTime.now();
        }
    }

    public void addLine(Transaction line) {
        line.setBill(this);
        lines.add(line);
    }

    public Long getId() { return id; }
    public BillType getType() { return type; }
    public String getPartyName() { return partyName; }
    public OffsetDateTime getOccurredAt() { return occurredAt; }
    public UUID getIdempotencyKey() { return idempotencyKey; }
    public Bill getCorrectionOfBill() { return correctionOfBill; }
    public List<Transaction> getLines() { return Collections.unmodifiableList(lines); }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
