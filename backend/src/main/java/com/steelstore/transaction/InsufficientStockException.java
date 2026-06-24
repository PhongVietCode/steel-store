package com.steelstore.transaction;

public class InsufficientStockException extends RuntimeException {

    private final Long productId;
    private final int currentStock;
    private final int requested;

    public InsufficientStockException(Long productId, int currentStock, int requested) {
        super("Insufficient stock for product " + productId
                + ": requested=" + requested + ", available=" + currentStock);
        this.productId = productId;
        this.currentStock = currentStock;
        this.requested = requested;
    }

    public Long getProductId()    { return productId; }
    public int getCurrentStock()  { return currentStock; }
    public int getRequested()     { return requested; }
}
