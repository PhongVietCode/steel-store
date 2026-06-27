package com.steelstore.transaction;

public class DuplicateProductInBillException extends RuntimeException {

    private final Long productId;

    public DuplicateProductInBillException(Long productId) {
        super("Product " + productId + " appears on more than one line of the same bill. "
                + "Combine the duplicate lines before submitting.");
        this.productId = productId;
    }

    public Long getProductId() {
        return productId;
    }
}
