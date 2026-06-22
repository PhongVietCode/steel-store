-- Bootstrap the single admin account.
--
-- password_hash is BCrypt (cost 10) of the literal password "admin".
-- This is a DEV seed: rotate before any non-local deploy.
-- (Stage 10's deploy prep will read username/password from env on first boot.)

INSERT INTO users (username, password_hash)
VALUES ('admin', '$2b$10$E9kD6j95Xd5yLmtgucUFLOqh4t/5eQUCb6TzUOe.p75WrvgWrxkr2')
ON CONFLICT (username) DO NOTHING;
