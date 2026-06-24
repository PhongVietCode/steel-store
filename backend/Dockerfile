# syntax=docker/dockerfile:1.7

# ── build ──────────────────────────────────────────────────────────────
# Use the project's gradle wrapper so the build version stays in sync with
# what developers run locally (Gradle 9.5+ for Spring Boot 4).
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace

# Cache wrapper + dependency descriptors first so source edits don't bust
# the dependency layer.
COPY gradlew gradlew
COPY gradle gradle
COPY settings.gradle build.gradle ./
RUN chmod +x ./gradlew && ./gradlew --no-daemon dependencies > /dev/null 2>&1 || true

COPY src src
RUN ./gradlew --no-daemon bootJar -x test \
    && cp build/libs/*.jar /workspace/app.jar

# ── runtime ───────────────────────────────────────────────────────────
# Alpine JRE rather than pure distroless: ~20MB larger but ships `wget`
# so the compose healthcheck has something to call. Runs as non-root.
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --from=build /workspace/app.jar /app/app.jar
EXPOSE 8080
USER app
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=5 \
    CMD wget -qO- http://127.0.0.1:8080/actuator/health > /dev/null || exit 1
