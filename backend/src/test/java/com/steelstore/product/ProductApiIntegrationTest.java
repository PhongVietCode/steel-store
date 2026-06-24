package com.steelstore.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.steelstore.support.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@AutoConfigureMockMvc
@WithMockUser(username = "admin", roles = "ADMIN")
class ProductApiIntegrationTest extends AbstractIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ProductRepository repository;
    final ObjectMapper json = new ObjectMapper();

    @BeforeEach
    void cleanProducts() {
        repository.deleteAll();
    }

    @Test
    void crudRoundTrip() throws Exception {
        // CREATE
        String createJson = """
            { "name": "Thép phi 6", "unit": "kg",
              "currentImportPrice": 18000,
              "currentSellingPrice": 21000,
              "currentStock": 100 }
            """;
        String createBody = mvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Thép phi 6"))
                .andExpect(jsonPath("$.currentStock").value(100))
                .andExpect(jsonPath("$.version").value(0))
                .andReturn().getResponse().getContentAsString();

        long id = json.readTree(createBody).get("id").asLong();

        // READ (by id)
        mvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Thép phi 6"))
                .andExpect(jsonPath("$.unit").value("kg"));

        // READ (list)
        mvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value((int) id));

        // UPDATE
        String updateJson = """
            { "name": "Thép phi 6 (mới)", "unit": "kg",
              "currentImportPrice": 19000,
              "currentSellingPrice": 22000 }
            """;
        mvc.perform(put("/api/products/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Thép phi 6 (mới)"))
                .andExpect(jsonPath("$.currentImportPrice").value(19000))
                .andExpect(jsonPath("$.version").value(1));

        // DELETE
        mvc.perform(delete("/api/products/{id}", id))
                .andExpect(status().isNoContent());

        // VERIFY GONE
        mvc.perform(get("/api/products/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Product not found"));
    }

    @Test
    void listFiltersByNameCaseInsensitive() throws Exception {
        repository.save(new Product("Thép phi 6",  "kg", 18000, 21000, 100));
        repository.save(new Product("Thép phi 8",  "kg", 19000, 22000, 80));
        repository.save(new Product("Xi măng PCB30", "bao", 95000, 110000, 50));

        mvc.perform(get("/api/products").param("name", "thép"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        mvc.perform(get("/api/products").param("name", "xi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Xi măng PCB30"));
    }

    @Test
    void createRejectsBlankNameAndNegativePrice() throws Exception {
        String bad = """
            { "name": "", "unit": "kg",
              "currentImportPrice": -1,
              "currentSellingPrice": 21000,
              "currentStock": 100 }
            """;
        String body = mvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bad))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation failed"))
                .andReturn().getResponse().getContentAsString();

        JsonNode fieldErrors = json.readTree(body).get("fieldErrors");
        assertThat(fieldErrors.has("name")).isTrue();
        assertThat(fieldErrors.has("currentImportPrice")).isTrue();
    }

    @Test
    void updateMissingReturns404() throws Exception {
        String upd = """
            { "name": "ghost", "unit": "kg",
              "currentImportPrice": 1, "currentSellingPrice": 1 }
            """;
        mvc.perform(put("/api/products/{id}", 999_999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(upd))
                .andExpect(status().isNotFound());
    }
}
