package com.steelstore.auth;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

@Component
public class JwtIssuer {

    private final SecretKey signingKey;
    private final JwtProperties props;

    public JwtIssuer(SecretKey jwtSigningKey, JwtProperties props) {
        this.signingKey = jwtSigningKey;
        this.props = props;
    }

    public IssuedToken issue(String username) {
        Instant now = Instant.now();
        Instant exp = now.plus(props.ttl());
        try {
            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .subject(username)
                    .issuer(props.issuer())
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(exp))
                    .build();
            SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
            jwt.sign(new MACSigner(signingKey));
            return new IssuedToken(jwt.serialize(), exp);
        } catch (JOSEException e) {
            throw new IllegalStateException("Failed to sign JWT", e);
        }
    }

    public record IssuedToken(String token, Instant expiresAt) {}
}
