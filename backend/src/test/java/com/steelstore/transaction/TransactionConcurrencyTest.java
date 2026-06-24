package com.steelstore.transaction;

import static org.assertj.core.api.Assertions.assertThat;

import com.steelstore.auth.JwtIssuer;
import com.steelstore.product.Product;
import com.steelstore.product.ProductRepository;
import com.steelstore.support.AbstractIntegrationTest;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/**
 * Verifies the Stage 4 hard concurrency gate:
 *   product with stock=10, 50 parallel SALEs of qty=1 -> exactly 10 succeed,
 *   the other 40 return 409, final stock=0, exactly 10 SALE rows in DB.
 *
 * Runs against a real embedded Tomcat (RANDOM_PORT) so true OS-level
 * parallelism exercises the optimistic locking + retry path.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class TransactionConcurrencyTest extends AbstractIntegrationTest {

    private static final int INITIAL_STOCK = 10;
    private static final int PARALLEL_SALES = 50;

    @LocalServerPort int port;
    @Autowired ProductRepository productRepository;
    @Autowired TransactionRepository transactionRepository;
    @Autowired JwtIssuer jwtIssuer;

    @Test
    void parallelSales_neverOversell() throws Exception {
        transactionRepository.deleteAll();
        productRepository.deleteAll();
        Product seeded = productRepository.save(
                new Product("Concurrency tester", "kg", 18000, 21000, INITIAL_STOCK));
        Long productId = seeded.getId();

        String bearer = "Bearer " + jwtIssuer.issue("admin").token();
        RestClient http = RestClient.builder()
                .baseUrl("http://127.0.0.1:" + port)
                .defaultHeader("Authorization", bearer)
                .build();

        ExecutorService pool = Executors.newFixedThreadPool(PARALLEL_SALES);
        AtomicInteger ok = new AtomicInteger();
        AtomicInteger conflict = new AtomicInteger();
        AtomicInteger other = new AtomicInteger();

        try {
            CompletableFuture<?>[] futures = new CompletableFuture[PARALLEL_SALES];
            for (int i = 0; i < PARALLEL_SALES; i++) {
                futures[i] = CompletableFuture.runAsync(() -> {
                    UUID key = UUID.randomUUID();
                    String body = """
                        {"productId":%d, "quantity":1, "unitPrice":21000}
                        """.formatted(productId);
                    try {
                        http.method(HttpMethod.POST)
                                .uri("/api/transactions/sales")
                                .headers(h -> {
                                    h.set("Idempotency-Key", key.toString());
                                    h.setContentType(MediaType.APPLICATION_JSON);
                                })
                                .body(body)
                                .retrieve()
                                .toBodilessEntity();
                        ok.incrementAndGet();
                    } catch (RestClientResponseException e) {
                        if (e.getStatusCode().value() == 409) {
                            conflict.incrementAndGet();
                        } else {
                            other.incrementAndGet();
                        }
                    }
                }, pool);
            }
            CompletableFuture.allOf(futures).get(60, TimeUnit.SECONDS);
        } finally {
            pool.shutdown();
            pool.awaitTermination(5, TimeUnit.SECONDS);
        }

        assertThat(ok.get())
                .as("successful sales").isEqualTo(INITIAL_STOCK);
        assertThat(conflict.get())
                .as("409 conflicts").isEqualTo(PARALLEL_SALES - INITIAL_STOCK);
        assertThat(other.get())
                .as("unexpected errors").isZero();

        Product after = productRepository.findById(productId).orElseThrow();
        assertThat(after.getCurrentStock()).isZero();

        long saleCount = transactionRepository.findAll().stream()
                .filter(t -> t.getType() == TransactionType.SALE)
                .count();
        assertThat(saleCount).as("SALE rows in DB").isEqualTo(INITIAL_STOCK);
    }
}
