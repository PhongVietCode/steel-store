package com.steelstore.transaction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.steelstore.product.Product;
import com.steelstore.product.ProductRepository;
import com.steelstore.support.AbstractIntegrationTest;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.ObjectMapper;

@AutoConfigureMockMvc
@WithMockUser(username = "admin", roles = "ADMIN")
class BillApiIntegrationTest extends AbstractIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ProductRepository productRepository;
    @Autowired BillRepository billRepository;
    @Autowired TransactionRepository transactionRepository;
    final ObjectMapper json = new ObjectMapper();

    Long pSteel;
    Long pCement;

    @BeforeEach
    void setupFresh() {
        transactionRepository.deleteAll();
        billRepository.deleteAll();
        productRepository.deleteAll();
        pSteel  = productRepository.save(new Product("Steel",  "kg",  0, 21000, 0)).getId();
        pCement = productRepository.save(new Product("Cement", "bag", 0, 110000, 0)).getId();
    }

    @Test
    void importBillThenSaleBill_updatesStocksAndSnapshotsCostBasis() throws Exception {
        // Multi-line IMPORT: 10 steel @ 18000 + 5 cement @ 95000
        postJson("/api/bills/import", UUID.randomUUID(),
                """
                { "lines": [
                    { "productId": %d, "quantity": 10, "unitPrice": 18000 },
                    { "productId": %d, "quantity":  5, "unitPrice": 95000 }
                ] }
                """.formatted(pSteel, pCement))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("IMPORT"))
                .andExpect(jsonPath("$.lines.length()").value(2))
                .andExpect(jsonPath("$.total").value(10 * 18000 + 5 * 95000));

        Product steel = productRepository.findById(pSteel).orElseThrow();
        Product cement = productRepository.findById(pCement).orElseThrow();
        assertThat(steel.getCurrentStock()).isEqualTo(10);
        assertThat(steel.getCurrentImportPrice()).isEqualTo(18000);
        assertThat(cement.getCurrentStock()).isEqualTo(5);
        assertThat(cement.getCurrentImportPrice()).isEqualTo(95000);

        // Multi-line SALE: 3 steel @ 21000 + 2 cement @ 110000
        postJson("/api/bills/sale", UUID.randomUUID(),
                """
                { "partyName": "Khách lẻ", "lines": [
                    { "productId": %d, "quantity": 3, "unitPrice": 21000 },
                    { "productId": %d, "quantity": 2, "unitPrice": 110000 }
                ] }
                """.formatted(pSteel, pCement))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("SALE"))
                .andExpect(jsonPath("$.partyName").value("Khách lẻ"))
                .andExpect(jsonPath("$.lines.length()").value(2))
                // SALE lines carry cost basis snapshot
                .andExpect(jsonPath("$.lines[?(@.productId == " + pSteel + ")].costBasisPerUnit")
                        .value(org.hamcrest.Matchers.contains(18000)))
                .andExpect(jsonPath("$.lines[?(@.productId == " + pCement + ")].costBasisPerUnit")
                        .value(org.hamcrest.Matchers.contains(95000)));

        steel = productRepository.findById(pSteel).orElseThrow();
        cement = productRepository.findById(pCement).orElseThrow();
        assertThat(steel.getCurrentStock()).isEqualTo(7);
        assertThat(cement.getCurrentStock()).isEqualTo(3);
    }

    @Test
    void oversellOnAnyLine_rollsBackTheWholeBill() throws Exception {
        // Seed 10 steel
        postJson("/api/bills/import", UUID.randomUUID(),
                """
                { "lines": [ { "productId": %d, "quantity": 10, "unitPrice": 18000 } ] }
                """.formatted(pSteel))
                .andExpect(status().isCreated());

        // SALE bill with 3 lines; the MIDDLE line oversells.
        // All-or-nothing: nothing should be saved.
        postJson("/api/bills/sale", UUID.randomUUID(),
                """
                { "lines": [
                    { "productId": %d, "quantity":  2, "unitPrice": 21000 },
                    { "productId": %d, "quantity": 99, "unitPrice": 21000 },
                    { "productId": %d, "quantity":  1, "unitPrice": 21000 }
                ] }
                """.formatted(pSteel, pSteel, pSteel))
                .andExpect(status().isBadRequest());  // duplicate product → 400

        // With distinct products, oversell still rolls back atomically.
        // Stage another product to test with.
        Long pPlate = productRepository.save(new Product("Plate", "kg", 0, 50000, 0)).getId();
        postJson("/api/bills/import", UUID.randomUUID(),
                """
                { "lines": [ { "productId": %d, "quantity": 5, "unitPrice": 40000 } ] }
                """.formatted(pPlate))
                .andExpect(status().isCreated());

        long steelStockBefore = productRepository.findById(pSteel).orElseThrow().getCurrentStock();
        long plateStockBefore = productRepository.findById(pPlate).orElseThrow().getCurrentStock();
        long billsBefore = billRepository.count();
        long linesBefore = transactionRepository.count();

        postJson("/api/bills/sale", UUID.randomUUID(),
                """
                { "lines": [
                    { "productId": %d, "quantity":  2, "unitPrice": 21000 },
                    { "productId": %d, "quantity": 99, "unitPrice": 50000 }
                ] }
                """.formatted(pSteel, pPlate))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Insufficient stock"))
                .andExpect(jsonPath("$.productId").value(pPlate))
                .andExpect(jsonPath("$.currentStock").value(5))
                .andExpect(jsonPath("$.requested").value(99));

        // Nothing changed: same stocks, no new bill, no new lines.
        assertThat(productRepository.findById(pSteel).orElseThrow().getCurrentStock())
                .isEqualTo((int) steelStockBefore);
        assertThat(productRepository.findById(pPlate).orElseThrow().getCurrentStock())
                .isEqualTo((int) plateStockBefore);
        assertThat(billRepository.count()).isEqualTo(billsBefore);
        assertThat(transactionRepository.count()).isEqualTo(linesBefore);
    }

    @Test
    void sameIdempotencyKeyTwice_returnsSameBill() throws Exception {
        postJson("/api/bills/import", UUID.randomUUID(),
                """
                { "lines": [ { "productId": %d, "quantity": 5, "unitPrice": 18000 } ] }
                """.formatted(pSteel))
                .andExpect(status().isCreated());

        UUID key = UUID.randomUUID();
        MvcResult r1 = postJson("/api/bills/sale", key,
                """
                { "lines": [ { "productId": %d, "quantity": 2, "unitPrice": 21000 } ] }
                """.formatted(pSteel))
                .andExpect(status().isCreated())
                .andReturn();
        long id1 = json.readTree(r1.getResponse().getContentAsString()).get("id").asLong();

        MvcResult r2 = postJson("/api/bills/sale", key,
                """
                { "lines": [ { "productId": %d, "quantity": 2, "unitPrice": 21000 } ] }
                """.formatted(pSteel))
                .andExpect(status().isCreated())
                .andReturn();
        long id2 = json.readTree(r2.getResponse().getContentAsString()).get("id").asLong();

        assertThat(id2).isEqualTo(id1);
        // Only one sale applied.
        assertThat(productRepository.findById(pSteel).orElseThrow().getCurrentStock())
                .isEqualTo(3);
    }

    @Test
    void missingIdempotencyKey_returns400() throws Exception {
        mvc.perform(post("/api/bills/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "lines": [ { "productId": %d, "quantity": 1, "unitPrice": 18000 } ] }
                                """.formatted(pSteel)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Idempotency-Key header required"));
    }

    @Test
    void duplicateProductIdInSameBill_returns400() throws Exception {
        postJson("/api/bills/import", UUID.randomUUID(),
                """
                { "lines": [
                    { "productId": %d, "quantity": 1, "unitPrice": 18000 },
                    { "productId": %d, "quantity": 2, "unitPrice": 19000 }
                ] }
                """.formatted(pSteel, pSteel))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Duplicate product on bill"))
                .andExpect(jsonPath("$.productId").value(pSteel));
    }

    @Test
    void emptyLines_returns400() throws Exception {
        postJson("/api/bills/import", UUID.randomUUID(),
                """
                { "lines": [] }
                """)
                .andExpect(status().isBadRequest());
    }

    @Test
    void reverseSaleBill_createsCounterAndRestoresStock() throws Exception {
        postJson("/api/bills/import", UUID.randomUUID(),
                """
                { "lines": [ { "productId": %d, "quantity": 10, "unitPrice": 18000 } ] }
                """.formatted(pSteel))
                .andExpect(status().isCreated());

        MvcResult sale = postJson("/api/bills/sale", UUID.randomUUID(),
                """
                { "lines": [ { "productId": %d, "quantity": 3, "unitPrice": 21000 } ] }
                """.formatted(pSteel))
                .andExpect(status().isCreated())
                .andReturn();
        long saleId = json.readTree(sale.getResponse().getContentAsString()).get("id").asLong();

        postJson("/api/bills/" + saleId + "/reverse", UUID.randomUUID(), "{}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("SALE"))
                .andExpect(jsonPath("$.correctionOfBillId").value((int) saleId))
                .andExpect(jsonPath("$.lines[0].quantity").value(-3));

        // Stock back to 10
        assertThat(productRepository.findById(pSteel).orElseThrow().getCurrentStock())
                .isEqualTo(10);

        // Source bill is now flagged as reversed in detail view
        mvc.perform(get("/api/bills/" + saleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reversedByBillId").isNotEmpty());
    }

    @Test
    void reverseAlreadyReversedBill_returns409() throws Exception {
        postJson("/api/bills/import", UUID.randomUUID(),
                """
                { "lines": [ { "productId": %d, "quantity": 5, "unitPrice": 18000 } ] }
                """.formatted(pSteel))
                .andExpect(status().isCreated());

        MvcResult sale = postJson("/api/bills/sale", UUID.randomUUID(),
                """
                { "lines": [ { "productId": %d, "quantity": 2, "unitPrice": 21000 } ] }
                """.formatted(pSteel))
                .andReturn();
        long saleId = json.readTree(sale.getResponse().getContentAsString()).get("id").asLong();

        postJson("/api/bills/" + saleId + "/reverse", UUID.randomUUID(), "{}")
                .andExpect(status().isCreated());

        postJson("/api/bills/" + saleId + "/reverse", UUID.randomUUID(), "{}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Bill is not reversible"));
    }

    @Test
    void reverseCounterBill_returns409() throws Exception {
        postJson("/api/bills/import", UUID.randomUUID(),
                """
                { "lines": [ { "productId": %d, "quantity": 5, "unitPrice": 18000 } ] }
                """.formatted(pSteel))
                .andExpect(status().isCreated());
        MvcResult sale = postJson("/api/bills/sale", UUID.randomUUID(),
                """
                { "lines": [ { "productId": %d, "quantity": 2, "unitPrice": 21000 } ] }
                """.formatted(pSteel))
                .andReturn();
        long saleId = json.readTree(sale.getResponse().getContentAsString()).get("id").asLong();

        MvcResult rev = postJson("/api/bills/" + saleId + "/reverse", UUID.randomUUID(), "{}")
                .andExpect(status().isCreated())
                .andReturn();
        long counterId = json.readTree(rev.getResponse().getContentAsString()).get("id").asLong();

        postJson("/api/bills/" + counterId + "/reverse", UUID.randomUUID(), "{}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Bill is not reversible"));
    }

    private org.springframework.test.web.servlet.ResultActions postJson(
            String url, UUID idemKey, String body) throws Exception {
        return mvc.perform(post(url)
                .header("Idempotency-Key", idemKey.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }
}
