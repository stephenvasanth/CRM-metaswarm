# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy pom.xml and download dependencies first (layer-cache friendly)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN mvn package -B -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy the built jar from the builder stage
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
