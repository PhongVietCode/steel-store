package com.steelstore.transaction;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

/**
 * Validates the Idempotency-Key header for POST /api/transactions/*
 * write endpoints. Stashes the parsed UUID on the request as attribute
 * {@link #ATTRIBUTE} for the controller/service to pick up.
 */
@Component
public class IdempotencyKeyFilter extends OncePerRequestFilter {

    public static final String HEADER = "Idempotency-Key";
    public static final String ATTRIBUTE = "idempotency.key";

    private final ObjectMapper json;

    public IdempotencyKeyFilter(ObjectMapper json) {
        this.json = json;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) return true;
        String path = request.getRequestURI();
        return !path.startsWith("/api/transactions");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String raw = req.getHeader(HEADER);
        if (raw == null || raw.isBlank()) {
            writeProblem(res, HttpStatus.BAD_REQUEST,
                    "Idempotency-Key header required",
                    "POST " + req.getRequestURI() + " requires an Idempotency-Key header (UUID).");
            return;
        }

        UUID key;
        try {
            key = UUID.fromString(raw);
        } catch (IllegalArgumentException e) {
            writeProblem(res, HttpStatus.BAD_REQUEST,
                    "Invalid Idempotency-Key",
                    "Idempotency-Key must be a valid UUID; got: " + raw);
            return;
        }

        req.setAttribute(ATTRIBUTE, key);
        chain.doFilter(req, res);
    }

    private void writeProblem(HttpServletResponse res, HttpStatus status, String title, String detail)
            throws IOException {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(status, detail);
        body.setTitle(title);
        res.setStatus(status.value());
        res.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        json.writeValue(res.getOutputStream(), body);
    }
}
