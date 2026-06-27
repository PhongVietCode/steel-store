package com.steelstore.transaction;

import com.steelstore.product.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

/**
 * One line within a {@link Bill}. Type, occurred_at, idempotency, and
 * correction-linkage all live on the parent Bill; the line itself just
 * records what was moved (product, quantity, unit price, and SALE-only
 * cost basis snapshot).
 */
@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bill_id", nullable = false)
    private Bill bill;

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

    @Column(name = "note")
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
    private OffsetDateTime createdAt;

    protected Transaction() {}

    public Transaction(Product product, int quantity, long unitPrice,
                       Long costBasisPerUnit, String note) {
        this.product = product;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.costBasisPerUnit = costBasisPerUnit;
        this.note = note;
    }

    void setBill(Bill bill) {
        this.bill = bill;
    }

    public Long getId() { return id; }
    public Bill getBill() { return bill; }
    public Product getProduct() { return product; }
    public int getQuantity() { return quantity; }
    public long getUnitPrice() { return unitPrice; }
    public Long getCostBasisPerUnit() { return costBasisPerUnit; }
    public long getTotal() { return total; }
    public String getNote() { return note; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
