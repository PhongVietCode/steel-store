package com.steelstore.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * If ADMIN_PASSWORD is provided via environment / properties, ensure
 * the seeded admin's password matches it on boot. No-op when the value
 * is empty (dev seed wins) or when the current hash already matches.
 *
 * <p>This lets a production deploy rotate the dev seed (`admin`) without
 * manual SQL or a separate setup step, while keeping the local-dev
 * experience zero-config.
 */
@Component
public class AdminPasswordRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminPasswordRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final String username;
    private final String password;

    public AdminPasswordRunner(
            UserRepository userRepository,
            PasswordEncoder encoder,
            @Value("${admin.username:admin}") String username,
            @Value("${admin.password:}") String password) {
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.username = username;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (password.isBlank()) return;

        // Match the frontend's pre-hash: SHA-256(username + ":" + password) → hex.
        // Server then BCrypts this digest, so raw plaintext is never stored or compared.
        String clientHash = sha256Hex(username + ":" + password);

        userRepository.findByUsername(username).ifPresentOrElse(
                user -> {
                    if (encoder.matches(clientHash, user.getPasswordHash())) {
                        log.info("Admin password matches env value; nothing to do.");
                    } else {
                        user.setPasswordHash(encoder.encode(clientHash));
                        userRepository.save(user);
                        log.info("Updated admin '{}' password from ADMIN_PASSWORD env.", username);
                    }
                },
                () -> log.warn("ADMIN_PASSWORD set but user '{}' not in DB; skipping.", username));
    }

    private static String sha256Hex(String input) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
