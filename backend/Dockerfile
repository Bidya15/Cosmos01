# ── Stage 1: Build ──────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
# Cache dependencies
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# ── Stage 2: Runtime ────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Add non-root user
RUN addgroup -S cosmos && adduser -S cosmos -G cosmos
USER cosmos

COPY --from=builder /app/target/cosmos-backend-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]
