package com.steelstore.auth.dto;

import java.time.Instant;

public record LoginResponse(String token, Instant expiresAt) {}
