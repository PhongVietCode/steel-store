package com.steelstore.product;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 32)
    private String unit;

    @Column(name = "current_import_price", nullable = false)
    private long currentImportPrice;

    @Column(name = "current_selling_price", nullable = false)
    private long currentSellingPrice;

    @Column(name = "current_stock", nullable = false)
    private int currentStock;

    @Column(name = "latest_import_date")
    private LocalDate latestImportDate;

    @Version
    @Column(nullable = false)
    private long version;

    @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private OffsetDateTime updatedAt;

    protected Product() {}

    public Product(String name, String unit, long currentImportPrice,
                   long currentSellingPrice, int currentStock) {
        this.name = name;
        this.unit = unit;
        this.currentImportPrice = currentImportPrice;
        this.currentSellingPrice = currentSellingPrice;
        this.currentStock = currentStock;
    }

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getUnit() { return unit; }
    public long getCurrentImportPrice() { return currentImportPrice; }
    public long getCurrentSellingPrice() { return currentSellingPrice; }
    public int getCurrentStock() { return currentStock; }
    public LocalDate getLatestImportDate() { return latestImportDate; }
    public long getVersion() { return version; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }

    public void setName(String name) { this.name = name; }
    public void setUnit(String unit) { this.unit = unit; }
    public void setCurrentImportPrice(long currentImportPrice) { this.currentImportPrice = currentImportPrice; }
    public void setCurrentSellingPrice(long currentSellingPrice) { this.currentSellingPrice = currentSellingPrice; }
    public void setCurrentStock(int currentStock) { this.currentStock = currentStock; }
    public void setLatestImportDate(LocalDate latestImportDate) { this.latestImportDate = latestImportDate; }
}
