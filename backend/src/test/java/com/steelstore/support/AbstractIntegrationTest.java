package com.steelstore.support;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;

/**
 * Base class for @SpringBootTest integration tests. Spins up a single
 * Postgres container per JVM (static field), and registers its JDBC URL
 * via @DynamicPropertySource so Flyway and Hibernate connect to it.
 *
 * Avoids @ServiceConnection because on macOS/Colima the random-port
 * forwarding has subtle timing/IPv6 issues; an explicit dynamic property
 * approach with a port-listening wait strategy is more reliable.
 */
@SpringBootTest
public abstract class AbstractIntegrationTest {

    @SuppressWarnings("resource")
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>(DockerImageName.parse("postgres:16"))
                    .withDatabaseName("steelstore_it")
                    .withUsername("steelstore_it")
                    .withPassword("steelstore_it")
                    .waitingFor(Wait.forListeningPort());

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void registerProps(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        r.add("spring.datasource.username", POSTGRES::getUsername);
        r.add("spring.datasource.password", POSTGRES::getPassword);
        // Production runs with maximum-pool-size: 60. Tests cache multiple
        // Spring contexts (a MockMvc one + a RANDOM_PORT one for the
        // concurrency test); two 60-connection pools open in parallel
        // exceed Postgres's default max_connections=100. Cap at 20 here.
        r.add("spring.datasource.hikari.maximum-pool-size", () -> "20");
    }
}
