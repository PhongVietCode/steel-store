package com.steelstore.api;

import com.steelstore.product.ProductNotFoundException;
import com.steelstore.transaction.InsufficientStockException;
import com.steelstore.transaction.IrreversibleTransactionException;
import com.steelstore.transaction.TransactionService.ConflictRetryExhaustedException;
import com.steelstore.transaction.TransactionService.TransactionNotFoundException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleProductNotFound(ProductNotFoundException ex) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        body.setTitle("Product not found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(TransactionNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleTransactionNotFound(TransactionNotFoundException ex) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        body.setTitle("Transaction not found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ProblemDetail> handleInsufficientStock(InsufficientStockException ex) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        body.setTitle("Insufficient stock");
        body.setProperty("productId", ex.getProductId());
        body.setProperty("currentStock", ex.getCurrentStock());
        body.setProperty("requested", ex.getRequested());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(IrreversibleTransactionException.class)
    public ResponseEntity<ProblemDetail> handleIrreversible(IrreversibleTransactionException ex) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        body.setTitle("Transaction is not reversible");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(ConflictRetryExhaustedException.class)
    public ResponseEntity<ProblemDetail> handleRetryExhausted(ConflictRetryExhaustedException ex) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        body.setTitle("Concurrent update conflict");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, "Validation failed for one or more fields.");
        body.setTitle("Validation failed");

        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(fe ->
                fieldErrors.put(fe.getField(),
                        fe.getDefaultMessage() == null ? "invalid" : fe.getDefaultMessage()));
        body.setProperty("fieldErrors", fieldErrors);

        return handleExceptionInternal(ex, body, headers, HttpStatus.BAD_REQUEST, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(Exception ex, WebRequest request) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred.");
        body.setTitle("Internal Server Error");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
