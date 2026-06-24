package com.steelstore.auth;

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

        userRepository.findByUsername(username).ifPresentOrElse(
                user -> {
                    if (encoder.matches(password, user.getPasswordHash())) {
                        log.info("Admin password matches env value; nothing to do.");
                    } else {
                        user.setPasswordHash(encoder.encode(password));
                        userRepository.save(user);
                        log.info("Updated admin '{}' password from ADMIN_PASSWORD env.", username);
                    }
                },
                () -> log.warn("ADMIN_PASSWORD set but user '{}' not in DB; skipping.", username));
    }
}
