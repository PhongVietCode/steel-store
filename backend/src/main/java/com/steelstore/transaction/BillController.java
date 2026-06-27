package com.steelstore.transaction;

import com.steelstore.transaction.dto.BillResponse;
import com.steelstore.transaction.dto.CreateBillRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bills")
public class BillController {

    private final BillService service;

    public BillController(BillService service) {
        this.service = service;
    }

    @PostMapping("/sale")
    @ResponseStatus(HttpStatus.CREATED)
    public BillResponse createSale(HttpServletRequest req,
                                   @Valid @RequestBody CreateBillRequest body) {
        return service.createBill(BillType.SALE, idempotencyKey(req), body);
    }

    @PostMapping("/import")
    @ResponseStatus(HttpStatus.CREATED)
    public BillResponse createImport(HttpServletRequest req,
                                     @Valid @RequestBody CreateBillRequest body) {
        return service.createBill(BillType.IMPORT, idempotencyKey(req), body);
    }

    @PostMapping("/{id}/reverse")
    @ResponseStatus(HttpStatus.CREATED)
    public BillResponse reverse(HttpServletRequest req, @PathVariable Long id) {
        return service.reverseBill(idempotencyKey(req), id);
    }

    @GetMapping
    public Page<BillResponse> search(
            @RequestParam(required = false) BillType type,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String partyName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
            Pageable pageable) {
        return service.search(type, from, to, productId, partyName, pageable);
    }

    @GetMapping("/{id}")
    public BillResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    private static UUID idempotencyKey(HttpServletRequest req) {
        return (UUID) req.getAttribute(IdempotencyKeyFilter.ATTRIBUTE);
    }
}
