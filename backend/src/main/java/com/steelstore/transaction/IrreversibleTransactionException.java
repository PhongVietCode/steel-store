package com.steelstore.transaction;

public class IrreversibleTransactionException extends RuntimeException {
    public IrreversibleTransactionException(Long id, String reason) {
        super("Transaction " + id + " cannot be reversed: " + reason);
    }
}
