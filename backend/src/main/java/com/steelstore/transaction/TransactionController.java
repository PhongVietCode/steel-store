package com.steelstore.transaction;

import com.steelstore.transaction.dto.RecordImportRequest;
import com.steelstore.transaction.dto.RecordSaleRequest;
import com.steelstore.transaction.dto.ReverseRequest;
import com.steelstore.transaction.dto.TransactionResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService service;

    public TransactionController(TransactionService service) {
        this.service = service;
    }

    @PostMapping("/imports")
    public ResponseEntity<TransactionResponse> recordImport(
            HttpServletRequest req, @Valid @RequestBody RecordImportRequest body) {
        TransactionResponse t = service.recordImport(idempotencyKey(req), body);
        return ResponseEntity.status(201).body(t);
    }

    @PostMapping("/sales")
    public ResponseEntity<TransactionResponse> recordSale(
            HttpServletRequest req, @Valid @RequestBody RecordSaleRequest body) {
        TransactionResponse t = service.recordSale(idempotencyKey(req), body);
        return ResponseEntity.status(201).body(t);
    }

    @PostMapping("/{id}/reverse")
    public ResponseEntity<TransactionResponse> reverse(
            HttpServletRequest req, @PathVariable Long id, @RequestBody(required = false) ReverseRequest body) {
        String note = body == null ? null : body.note();
        TransactionResponse t = service.reverse(idempotencyKey(req), id, note);
        return ResponseEntity.status(201).body(t);
    }

    @GetMapping
    public Page<TransactionResponse> search(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
            Pageable pageable) {
        return service.search(productId, type, from, to, pageable);
    }

    private static UUID idempotencyKey(HttpServletRequest req) {
        return (UUID) req.getAttribute(IdempotencyKeyFilter.ATTRIBUTE);
    }
}
