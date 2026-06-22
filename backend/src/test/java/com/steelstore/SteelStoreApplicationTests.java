package com.steelstore;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Requires the dev Postgres (docker compose up -d) to be running.
 * Testcontainers is wired up in Stage 3 once entities/repositories arrive.
 */
@SpringBootTest
class SteelStoreApplicationTests {

    @Test
    void contextLoads() {
    }
}
