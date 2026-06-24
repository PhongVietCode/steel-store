package com.steelstore.product;

public class ProductInUseException extends RuntimeException {
    public ProductInUseException(Long id) {
        super("Product " + id + " has transactions and cannot be deleted; "
                + "consider hiding it from the catalog instead.");
    }
}
