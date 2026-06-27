package com.steelstore.transaction;

public class IrreversibleBillException extends RuntimeException {
    public IrreversibleBillException(Long id, String reason) {
        super("Bill " + id + " cannot be reversed: " + reason);
    }
}
