package com.icodeap.ecommerce.backend.infrastructure.jwt;

import io.jsonwebtoken.security.Keys;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Optional;

public class Constants {
    public static final String HEADER_AUTHORIZATION = "Authorization";
    public static final String TOKEN_BEARER_PREFIX = "Bearer ";

    // En despliegue se toma de la variable JWT_SECRET (minimo 64 caracteres para HS512).
    // El valor por defecto es publico y solo sirve para desarrollo local.
    public static final String SUPER_SECRET_KEY = Optional.ofNullable(System.getenv("JWT_SECRET"))
            .filter(secret -> !secret.isBlank())
            .orElse("ZnJhc2VzbGFyZ2FzcGFyYWNvbG9jYXJjb21vY2xhdmVlbnVucHJvamVjdG9kZWVtZXBsb3BhcmF");
    public  static  final  long TOKEN_EXPIRATION_TIME = 1500000; //15 MINUTOS

    public static Key getSignedKey(String secretKey){
        byte [] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
