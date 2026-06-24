package com.steelstore.transaction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import tools.jackson.databind.ObjectMapper;
import com.steelstore.product.Product;
import com.steelstore.product.ProductRepository;
import com.steelstore.support.AbstractIntegrationTest;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@AutoConfigureMockMvc
@WithMockUser(username = "admin", roles = "ADMIN")
class TransactionApiIntegrationTest extends AbstractIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ProductRepository productRepository;
    @Autowired TransactionRepository transactionRepository;
    final ObjectMapper json = new ObjectMapper();

    Long productId;

    @BeforeEach
    void setupFresh() {
        transactionRepository.deleteAll();
        productRepository.deleteAll();
        productId = productRepository.save(
                new Product("Thép phi 6", "kg", 0, 21000, 0)).getId();
    }

    @Test
    void importThenSale_updatesStockAndSnapshotsCostBasis() throws Exception {
        // import 10 @ 18000
        postJson("/api/transactions/imports", UUID.randomUUID(),
                """
                {"productId":%d, "quantity":10, "unitPrice":18000}
                """.formatted(productId))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("IMPORT"))
                .andExpect(jsonPath("$.quantity").value(10))
                .andExpect(jsonPath("$.costBasisPerUnit").doesNotExist())
                .andExpect(jsonPath("$.total").value(180_000));

        // sale 3 @ 21000  (cost basis snapshot should be 18000)
        postJson("/api/transactions/sales", UUID.randomUUID(),
                """
                {"productId":%d, "quantity":3, "unitPrice":21000}
                """.formatted(productId))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("SALE"))
                .andExpect(jsonPath("$.costBasisPerUnit").value(18000))
                .andExpect(jsonPath("$.total").value(63_000));

        Product fresh = productRepository.findById(productId).orElseThrow();
        assertThat(fresh.getCurrentStock()).isEqualTo(7);
        assertThat(fresh.getCurrentImportPrice()).isEqualTo(18000);
        assertThat(fresh.getLatestImportDate()).isNotNull();
    }

    @Test
    void oversell_returns409_withCurrentStockAndRequested() throws Exception {
        postJson("/api/transactions/imports", UUID.randomUUID(),
                """
                {"productId":%d, "quantity":5, "unitPrice":18000}
                """.formatted(productId))
                .andExpect(status().isCreated());

        postJson("/api/transactions/sales", UUID.randomUUID(),
                """
                {"productId":%d, "quantity":99, "unitPrice":21000}
                """.formatted(productId))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Insufficient stock"))
                .andExpect(jsonPath("$.currentStock").value(5))
                .andExpect(jsonPath("$.requested").value(99))
                .andExpect(jsonPath("$.productId").value(productId));

        Product fresh = productRepository.findById(productId).orElseThrow();
        assertThat(fresh.getCurrentStock()).isEqualTo(5);
    }

    @Test
    void sameIdempotencyKeyTwice_returnsSameRow() throws Exception {
        postJson("/api/transactions/imports", UUID.randomUUID(),
                """
                {"productId":%d, "quantity":5, "unitPrice":18000}
                """.formatted(productId))
                .andExpect(status().isCreated());

        UUID key = UUID.randomUUID();
        MvcResult r1 = postJson("/api/transactions/sales", key,
                """
                {"productId":%d, "quantity":2, "unitPrice":21000}
                """.formatted(productId))
                .andExpect(status().isCreated())
                .andReturn();
        long id1 = json.readTree(r1.getResponse().getContentAsString()).get("id").asLong();

        MvcResult r2 = postJson("/api/transactions/sales", key,
                """
                {"productId":%d, "quantity":2, "unitPrice":21000}
                """.formatted(productId))
                .andExpect(status().isCreated())
                .andReturn();
        long id2 = json.readTree(r2.getResponse().getContentAsString()).get("id").asLong();

        assertThat(id2).isEqualTo(id1);
        Product fresh = productRepository.findById(productId).orElseThrow();
        assertThat(fresh.getCurrentStock()).isEqualTo(3);  // only one sale applied
    }

    @Test
    void missingIdempotencyKey_returns400() throws Exception {
        mvc.perform(post("/api/transactions/imports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"productId":%d, "quantity":1, "unitPrice":18000}
                            """.formatted(productId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Idempotency-Key header required"));
    }

    @Test
    void reverseSale_createsCorrectionAndRestoresStock() throws Exception {
        postJson("/api/transactions/imports", UUID.randomUUID(),
                """
                {"productId":%d, "quantity":10, "unitPrice":18000}
                """.formatted(productId))
                .andExpect(status().isCreated());

        MvcResult sale = postJson("/api/transactions/sales", UUID.randomUUID(),
                """
                {"productId":%d, "quantity":3, "unitPrice":21000}
                """.formatted(productId))
                .andExpect(status().isCreated())
                .andReturn();
        long saleId = json.readTree(sale.getResponse().getContentAsString()).get("id").asLong();

        postJson("/api/transactions/" + saleId + "/reverse", UUID.randomUUID(),
                """
                {"note":"Customer returned"}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("SALE"))
                .andExpect(jsonPath("$.quantity").value(-3))
                .andExpect(jsonPath("$.correctionOfId").value((int) saleId));

        Product fresh = productRepository.findById(productId).orElseThrow();
        assertThat(fresh.getCurrentStock()).isEqualTo(10);  // sale undone
        List<Transaction> all = transactionRepository.findAll();
        assertThat(all).hasSize(3);  // import + sale + reverse
    }

    private org.springframework.test.web.servlet.ResultActions postJson(
            String url, UUID idemKey, String body) throws Exception {
        return mvc.perform(post(url)
                .header("Idempotency-Key", idemKey.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }
}
