package com.steelstore.transaction;

import com.steelstore.product.Product;
import com.steelstore.product.ProductNotFoundException;
import com.steelstore.product.ProductRepository;
import com.steelstore.transaction.dto.BillLineRequest;
import com.steelstore.transaction.dto.BillResponse;
import com.steelstore.transaction.dto.CreateBillRequest;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
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

/**
 * Writes a whole bill — header + N lines — in one DB transaction.
 * Atomic: any failure on any line (oversell, optimistic-lock conflict,
 * unknown product) rolls back the entire bill so no half-saved state
 * leaks. Idempotent at the bill level via {@code Idempotency-Key};
 * concurrency contention triggers up to 3 retries with 25/50/100 ms
 * backoff before surfacing a 409.
 */
@Service
public class BillService {

    private static final Logger log = LoggerFactory.getLogger(BillService.class);
    private static final int[] RETRY_BACKOFF_MS = {25, 50, 100};

    private final BillRepository billRepository;
    private final ProductRepository productRepository;
    private final TransactionTemplate tx;

    public BillService(BillRepository billRepository,
                       ProductRepository productRepository,
                       TransactionTemplate transactionTemplate) {
        this.billRepository = billRepository;
        this.productRepository = productRepository;
        this.tx = transactionTemplate;
    }

    public BillResponse createBill(BillType type, UUID idempotencyKey, CreateBillRequest req) {
        return runIdempotent(idempotencyKey, () -> withRetry(() -> tx.execute(status -> {
            rejectDuplicateProducts(req.lines());
            Map<Long, Product> products = loadProducts(
                    req.lines().stream().map(BillLineRequest::productId).toList());

            OffsetDateTime occurredAt = req.occurredAt() != null
                    ? req.occurredAt() : OffsetDateTime.now();
            Bill bill = new Bill(type, normalize(req.partyName()), occurredAt, idempotencyKey, null);

            for (BillLineRequest l : req.lines()) {
                Product product = products.get(l.productId());
                Long costBasis = applyLineToProduct(type, product, l.quantity(),
                        l.unitPrice(), occurredAt);
                productRepository.saveAndFlush(product);

                bill.addLine(new Transaction(product, l.quantity(), l.unitPrice(),
                        costBasis, l.note()));
            }

            Bill saved = billRepository.saveAndFlush(bill);
            return BillResponse.from(saved, null);
        })));
    }

    public BillResponse reverseBill(UUID idempotencyKey, Long sourceBillId) {
        return runIdempotent(idempotencyKey, () -> withRetry(() -> tx.execute(status -> {
            Bill source = billRepository.findWithLinesById(sourceBillId)
                    .orElseThrow(() -> new BillNotFoundException(sourceBillId));

            if (source.getCorrectionOfBill() != null) {
                throw new IrreversibleBillException(sourceBillId,
                        "bill is itself a correction");
            }
            if (billRepository.findByCorrectionOfBill_Id(sourceBillId).isPresent()) {
                throw new IrreversibleBillException(sourceBillId,
                        "bill has already been reversed");
            }

            Map<Long, Product> products = loadProducts(
                    source.getLines().stream().map(t -> t.getProduct().getId()).toList());

            Bill counter = new Bill(source.getType(), source.getPartyName(),
                    OffsetDateTime.now(), idempotencyKey, source);

            for (Transaction sl : source.getLines()) {
                Product product = products.get(sl.getProduct().getId());
                applyReverseToProduct(source.getType(), product, sl.getQuantity());
                productRepository.saveAndFlush(product);

                Long costBasis = source.getType() == BillType.SALE
                        ? sl.getCostBasisPerUnit() : null;
                counter.addLine(new Transaction(product, -sl.getQuantity(),
                        sl.getUnitPrice(), costBasis, null));
            }

            Bill saved = billRepository.saveAndFlush(counter);
            return BillResponse.from(saved, null);
        })));
    }

    @Transactional(readOnly = true)
    public BillResponse get(Long id) {
        Bill bill = billRepository.findWithLinesById(id)
                .orElseThrow(() -> new BillNotFoundException(id));
        Long reversedBy = billRepository.findByCorrectionOfBill_Id(id)
                .map(Bill::getId).orElse(null);
        return BillResponse.from(bill, reversedBy);
    }

    @Transactional(readOnly = true)
    public Page<BillResponse> search(BillType type, OffsetDateTime from, OffsetDateTime to,
                                     Long productId, String partyName, Pageable pageable) {
        Specification<Bill> spec = (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            if (type != null) preds.add(cb.equal(root.get("type"), type));
            if (from != null) preds.add(cb.greaterThanOrEqualTo(root.get("occurredAt"), from));
            if (to != null)   preds.add(cb.lessThan(root.get("occurredAt"), to));
            if (partyName != null && !partyName.isBlank()) {
                preds.add(cb.like(cb.lower(root.get("partyName")),
                        "%" + partyName.toLowerCase() + "%"));
            }
            if (productId != null) {
                Subquery<Long> sub = query.subquery(Long.class);
                Root<Transaction> lineRoot = sub.from(Transaction.class);
                sub.select(lineRoot.get("bill").get("id"))
                        .where(cb.equal(lineRoot.get("product").get("id"), productId));
                preds.add(root.get("id").in(sub));
            }
            return cb.and(preds.toArray(new Predicate[0]));
        };

        Page<Bill> page = billRepository.findAll(spec, pageable);
        Map<Long, Long> reversedBy = reversedByMap(page.getContent());
        return page.map(b -> BillResponse.from(b, reversedBy.get(b.getId())));
    }

    private void rejectDuplicateProducts(List<BillLineRequest> lines) {
        Set<Long> seen = new HashSet<>();
        for (BillLineRequest l : lines) {
            if (!seen.add(l.productId())) {
                throw new DuplicateProductInBillException(l.productId());
            }
        }
    }

    private Map<Long, Product> loadProducts(List<Long> productIds) {
        List<Product> loaded = productRepository.findAllById(productIds);
        Map<Long, Product> byId = new HashMap<>();
        for (Product p : loaded) byId.put(p.getId(), p);
        for (Long pid : productIds) {
            if (!byId.containsKey(pid)) {
                throw new ProductNotFoundException(pid);
            }
        }
        return byId;
    }

    private Long applyLineToProduct(BillType type, Product product, int quantity,
                                    long unitPrice, OffsetDateTime occurredAt) {
        return switch (type) {
            case SALE -> {
                if (product.getCurrentStock() < quantity) {
                    throw new InsufficientStockException(
                            product.getId(), product.getCurrentStock(), quantity);
                }
                long costBasis = product.getCurrentImportPrice();
                product.setCurrentStock(product.getCurrentStock() - quantity);
                yield costBasis;
            }
            case IMPORT -> {
                product.setCurrentStock(product.getCurrentStock() + quantity);
                product.setCurrentImportPrice(unitPrice);
                product.setLatestImportDate(occurredAt.toLocalDate());
                yield null;
            }
        };
    }

    private void applyReverseToProduct(BillType sourceType, Product product, int sourceQuantity) {
        switch (sourceType) {
            case SALE -> product.setCurrentStock(product.getCurrentStock() + sourceQuantity);
            case IMPORT -> {
                int newStock = product.getCurrentStock() - sourceQuantity;
                if (newStock < 0) {
                    throw new InsufficientStockException(
                            product.getId(), product.getCurrentStock(), sourceQuantity);
                }
                product.setCurrentStock(newStock);
                // current_import_price / latest_import_date are deliberately not
                // unwound — see CLAUDE.md known limitations.
            }
        }
    }

    private Map<Long, Long> reversedByMap(Collection<Bill> bills) {
        if (bills.isEmpty()) return Map.of();
        List<Long> ids = bills.stream().map(Bill::getId).toList();
        Map<Long, Long> out = new HashMap<>();
        for (Bill counter : billRepository.findAllByCorrectionOfBill_IdIn(ids)) {
            out.put(counter.getCorrectionOfBill().getId(), counter.getId());
        }
        return out;
    }

    private static String normalize(String s) {
        if (s == null) return null;
        String trimmed = s.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private BillResponse runIdempotent(UUID key, Supplier<BillResponse> work) {
        BillResponse fast = tx.execute(status ->
                billRepository.findByIdempotencyKey(key)
                        .map(b -> BillResponse.from(b, lookupReversedBy(b.getId())))
                        .orElse(null));
        if (fast != null) return fast;
        try {
            return work.get();
        } catch (DataIntegrityViolationException e) {
            return tx.execute(status ->
                    billRepository.findByIdempotencyKey(key)
                            .map(b -> BillResponse.from(b, lookupReversedBy(b.getId())))
                            .orElseThrow(() -> e));
        }
    }

    private Long lookupReversedBy(Long billId) {
        return billRepository.findByCorrectionOfBill_Id(billId).map(Bill::getId).orElse(null);
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
                    log.debug("Bill optimistic-lock retry {}/{}", i + 1, RETRY_BACKOFF_MS.length);
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

    public static class BillNotFoundException extends RuntimeException {
        public BillNotFoundException(Long id) {
            super("Bill not found: id=" + id);
        }
    }

    public static class ConflictRetryExhaustedException extends RuntimeException {
        public ConflictRetryExhaustedException(Throwable cause) {
            super("Stock contention: retries exhausted, please retry the request.", cause);
        }
    }
}
