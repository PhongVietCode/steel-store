package com.steelstore.transaction;

import com.steelstore.product.Product;
import com.steelstore.product.ProductNotFoundException;
import com.steelstore.product.ProductRepository;
import com.steelstore.transaction.dto.RecordImportRequest;
import com.steelstore.transaction.dto.RecordSaleRequest;
import com.steelstore.transaction.dto.TransactionResponse;
import jakarta.persistence.criteria.Predicate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionService.class);
    private static final int[] RETRY_BACKOFF_MS = {25, 50, 100};

    private final TransactionRepository transactionRepository;
    private final ProductRepository productRepository;
    private final TransactionTemplate tx;

    public TransactionService(TransactionRepository transactionRepository,
                              ProductRepository productRepository,
                              TransactionTemplate transactionTemplate) {
        this.transactionRepository = transactionRepository;
        this.productRepository = productRepository;
        this.tx = transactionTemplate;
    }

    public TransactionResponse recordImport(UUID idempotencyKey, RecordImportRequest req) {
        return runIdempotent(idempotencyKey, () -> withRetry(() -> tx.execute(status -> {
            Product product = loadProduct(req.productId());
            product.setCurrentStock(product.getCurrentStock() + req.quantity());
            product.setCurrentImportPrice(req.unitPrice());
            product.setLatestImportDate(OffsetDateTime.now().toLocalDate());
            productRepository.saveAndFlush(product);

            Transaction t = new Transaction(
                    TransactionType.IMPORT, product, req.quantity(), req.unitPrice(),
                    null, idempotencyKey, null, req.note()
            );
            return TransactionResponse.from(transactionRepository.saveAndFlush(t));
        })));
    }

    public TransactionResponse recordSale(UUID idempotencyKey, RecordSaleRequest req) {
        return runIdempotent(idempotencyKey, () -> withRetry(() -> tx.execute(status -> {
            Product product = loadProduct(req.productId());
            if (product.getCurrentStock() < req.quantity()) {
                throw new InsufficientStockException(
                        product.getId(), product.getCurrentStock(), req.quantity());
            }
            long costBasis = product.getCurrentImportPrice();
            product.setCurrentStock(product.getCurrentStock() - req.quantity());
            productRepository.saveAndFlush(product);

            Transaction t = new Transaction(
                    TransactionType.SALE, product, req.quantity(), req.unitPrice(),
                    costBasis, idempotencyKey, null, req.note()
            );
            return TransactionResponse.from(transactionRepository.saveAndFlush(t));
        })));
    }

    public TransactionResponse reverse(UUID idempotencyKey, Long originalId, String note) {
        return runIdempotent(idempotencyKey, () -> withRetry(() -> tx.execute(status -> {
            Transaction original = transactionRepository.findById(originalId)
                    .orElseThrow(() -> new TransactionNotFoundException(originalId));
            if (original.getCorrectionOf() != null) {
                throw new IrreversibleTransactionException(originalId,
                        "transaction is itself a correction");
            }
            if (original.getQuantity() < 0) {
                throw new IrreversibleTransactionException(originalId,
                        "transaction already has a negative quantity");
            }

            Product product = loadProduct(original.getProduct().getId());
            int delta = -original.getQuantity();
            switch (original.getType()) {
                case SALE -> product.setCurrentStock(product.getCurrentStock() - delta);
                // For SALE reverse, delta is positive → stock returns. The signed math
                // works either way; using one expression keeps intent obvious:
                case IMPORT -> {
                    int newStock = product.getCurrentStock() + delta;
                    if (newStock < 0) {
                        throw new InsufficientStockException(
                                product.getId(), product.getCurrentStock(), original.getQuantity());
                    }
                    product.setCurrentStock(newStock);
                }
            }
            productRepository.saveAndFlush(product);

            Transaction correction = new Transaction(
                    original.getType(), product,
                    -original.getQuantity(), original.getUnitPrice(),
                    original.getCostBasisPerUnit(), idempotencyKey, original, note
            );
            return TransactionResponse.from(transactionRepository.saveAndFlush(correction));
        })));
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> search(Long productId, TransactionType type,
                                            OffsetDateTime from, OffsetDateTime to,
                                            Pageable pageable) {
        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            if (productId != null) preds.add(cb.equal(root.get("product").get("id"), productId));
            if (type != null)      preds.add(cb.equal(root.get("type"), type));
            if (from != null)      preds.add(cb.greaterThanOrEqualTo(root.get("occurredAt"), from));
            if (to != null)        preds.add(cb.lessThan(root.get("occurredAt"), to));
            return cb.and(preds.toArray(new Predicate[0]));
        };
        return transactionRepository.findAll(spec, pageable)
                .map(TransactionResponse::from);
    }

    private Product loadProduct(Long id) {
        return productRepository.findById(id).orElseThrow(() -> new ProductNotFoundException(id));
    }

    private TransactionResponse runIdempotent(UUID key, Supplier<TransactionResponse> work) {
        // Fast path: was this key already handled? Wrap in tx so the lazy
        // product association is reachable when building the DTO.
        TransactionResponse fast = tx.execute(status ->
                transactionRepository.findByIdempotencyKey(key)
                        .map(TransactionResponse::from)
                        .orElse(null));
        if (fast != null) return fast;
        try {
            return work.get();
        } catch (DataIntegrityViolationException e) {
            // Race: another request inserted the same key first. Re-fetch and return it.
            return tx.execute(status ->
                    transactionRepository.findByIdempotencyKey(key)
                            .map(TransactionResponse::from)
                            .orElseThrow(() -> e));
        }
    }

    private <T> T withRetry(Supplier<T> op) {
        OptimisticLockingFailureException last = null;
        int attempts = RETRY_BACKOFF_MS.length + 1;
        for (int i = 0; i < attempts; i++) {
            try {
                return op.get();
            } catch (OptimisticLockingFailureException e) {
                last = e;
                if (i < RETRY_BACKOFF_MS.length) {
                    sleep(RETRY_BACKOFF_MS[i]);
                    log.debug("Optimistic lock retry {}/{}", i + 1, RETRY_BACKOFF_MS.length);
                }
            }
        }
        throw new ConflictRetryExhaustedException(last);
    }

    private void sleep(int ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new RuntimeException(ie);
        }
    }

    public static class TransactionNotFoundException extends RuntimeException {
        public TransactionNotFoundException(Long id) {
            super("Transaction not found: id=" + id);
        }
    }

    public static class ConflictRetryExhaustedException extends RuntimeException {
        public ConflictRetryExhaustedException(Throwable cause) {
            super("Stock contention: retries exhausted, please retry the request.", cause);
        }
    }
}
