package com.steelstore.report;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.steelstore.product.Product;
import com.steelstore.product.ProductRepository;
import com.steelstore.report.dto.ProfitReportResponse;
import com.steelstore.support.AbstractIntegrationTest;
import com.steelstore.transaction.TransactionRepository;
import com.steelstore.transaction.TransactionService;
import com.steelstore.transaction.dto.RecordImportRequest;
import com.steelstore.transaction.dto.RecordSaleRequest;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.ObjectMapper;

@AutoConfigureMockMvc
@WithMockUser(username = "admin", roles = "ADMIN")
class ProfitReportIntegrationTest extends AbstractIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired TransactionService txService;
    @Autowired ProductRepository productRepository;
    @Autowired TransactionRepository transactionRepository;
    final ObjectMapper json = new ObjectMapper();

    Long pSteel;
    Long pCement;

    @BeforeEach
    void seed() {
        transactionRepository.deleteAll();
        productRepository.deleteAll();
        pSteel  = productRepository.save(new Product("Steel",  "kg",  0, 0, 0)).getId();
        pCement = productRepository.save(new Product("Cement", "bag", 0, 0, 0)).getId();

        // Steel: import 100 @ 18000, then sell 30 @ 21000, then reverse 5 of those.
        txService.recordImport(UUID.randomUUID(),
                new RecordImportRequest(pSteel, 100, 18000, null));
        var steelSale = txService.recordSale(UUID.randomUUID(),
                new RecordSaleRequest(pSteel, 30, 21000, null));
        // Reverse PART of a sale by recording a brand-new SALE with negative
        // quantity? No — the API exposes /reverse which negates the WHOLE
        // original. Reverse all 30, then re-sell 25 to net a "sold 25" picture.
        txService.reverse(UUID.randomUUID(), steelSale.id(), "customer returned 5");
        txService.recordSale(UUID.randomUUID(),
                new RecordSaleRequest(pSteel, 25, 21000, null));

        // Cement: import 50 @ 95000, then sell 10 @ 110000.
        txService.recordImport(UUID.randomUUID(),
                new RecordImportRequest(pCement, 50, 95000, null));
        txService.recordSale(UUID.randomUUID(),
                new RecordSaleRequest(pCement, 10, 110000, null));
    }

    @Test
    void profitMatchesHandComputedNumbers() throws Exception {
        // Hand math:
        //   Steel net sold = 30 - 30 + 25 = 25 (sale + reverse + sale)
        //     revenue = 30*21000 + (-30)*21000 + 25*21000 = 25*21000 = 525_000
        //     cost    = 30*18000 + (-30)*18000 + 25*18000 = 25*18000 = 450_000
        //     profit  = 525_000 - 450_000 = 75_000
        //   Cement: 10 sold
        //     revenue = 10*110000 = 1_100_000
        //     cost    = 10* 95000 =   950_000
        //     profit  =            150_000
        //   Totals:
        //     revenue = 1_625_000, cost = 1_400_000, profit = 225_000

        LocalDate today = LocalDate.now(ProfitReportService.REPORT_ZONE);
        MvcResult res = mvc.perform(get("/api/reports/profit")
                        .param("from", today.toString())
                        .param("to", today.toString()))
                .andExpect(status().isOk())
                .andReturn();
        ProfitReportResponse body = json.readValue(
                res.getResponse().getContentAsString(), ProfitReportResponse.class);

        assertThat(body.revenue()).isEqualTo(1_625_000L);
        assertThat(body.cost()).isEqualTo(1_400_000L);
        assertThat(body.profit()).isEqualTo(225_000L);

        assertThat(body.byProduct()).hasSize(2);

        var cementRow = body.byProduct().stream()
                .filter(r -> r.productId().equals(pCement)).findFirst().orElseThrow();
        assertThat(cementRow.qtySold()).isEqualTo(10);
        assertThat(cementRow.revenue()).isEqualTo(1_100_000L);
        assertThat(cementRow.cost()).isEqualTo(950_000L);
        assertThat(cementRow.profit()).isEqualTo(150_000L);

        var steelRow = body.byProduct().stream()
                .filter(r -> r.productId().equals(pSteel)).findFirst().orElseThrow();
        assertThat(steelRow.qtySold()).isEqualTo(25);
        assertThat(steelRow.revenue()).isEqualTo(525_000L);
        assertThat(steelRow.cost()).isEqualTo(450_000L);
        assertThat(steelRow.profit()).isEqualTo(75_000L);
    }

    @Test
    void emptyDateRangeReturnsZeros() throws Exception {
        LocalDate ancient = LocalDate.of(2000, 1, 1);
        MvcResult res = mvc.perform(get("/api/reports/profit")
                        .param("from", ancient.toString())
                        .param("to", ancient.toString()))
                .andExpect(status().isOk())
                .andReturn();
        ProfitReportResponse body = json.readValue(
                res.getResponse().getContentAsString(), ProfitReportResponse.class);

        assertThat(body.revenue()).isZero();
        assertThat(body.cost()).isZero();
        assertThat(body.profit()).isZero();
        assertThat(body.byProduct()).isEmpty();
    }

    @Test
    void fromAfterTo_returns400() throws Exception {
        mvc.perform(get("/api/reports/profit")
                        .param("from", "2026-12-31")
                        .param("to",   "2026-01-01"))
                .andExpect(status().isBadRequest());
    }
}
