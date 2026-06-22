package com.steelstore.auth;

import com.steelstore.auth.dto.LoginRequest;
import com.steelstore.auth.dto.LoginResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtIssuer jwtIssuer;

    public AuthController(AuthenticationManager authenticationManager, JwtIssuer jwtIssuer) {
        this.authenticationManager = authenticationManager;
        this.jwtIssuer = jwtIssuer;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.username(), req.password()));
        JwtIssuer.IssuedToken issued = jwtIssuer.issue(req.username());
        return new LoginResponse(issued.token(), issued.expiresAt());
    }

    @ExceptionHandler({BadCredentialsException.class, UsernameNotFoundException.class, AuthenticationException.class})
    public ProblemDetail handleAuthFailure(AuthenticationException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNAUTHORIZED, "Invalid username or password.");
        pd.setTitle("Authentication failed");
        return pd;
    }
}
