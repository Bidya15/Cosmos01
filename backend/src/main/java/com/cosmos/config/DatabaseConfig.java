package com.cosmos.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Value("${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/cosmos}")
    private String dbUrl;

    @Value("${SPRING_DATASOURCE_USERNAME:postgres}")
    private String username;

    @Value("${SPRING_DATASOURCE_PASSWORD:password}")
    private String password;

    @Bean
    @Primary
    public DataSource dataSource() {
        System.out.println("--- DATABASE INITIALIZATION (Deep Clean Mode) ---");
        
        // Deep clean: Remove any non-printable or hidden non-ASCII characters (BOM, etc.)
        String sanitizedUrl = dbUrl.replaceAll("[^\\x20-\\x7e]", "").trim();
        String sanitizedUser = username.replaceAll("[^\\x20-\\x7e]", "").trim();
        String sanitizedPass = password.replaceAll("[^\\x20-\\x7e]", "").trim();
        
        // Debug: Log the first 10 hex characters to find hidden poisons
        StringBuilder hex = new StringBuilder();
        for (int i = 0; i < Math.min(sanitizedUrl.length(), 10); i++) {
            hex.append(String.format("%02x ", (int) sanitizedUrl.charAt(i)));
        }
        System.out.println("URL Hex (First 10): " + hex.toString());
        System.out.println("Cleaned URL: " + sanitizedUrl);
        
        HikariConfig config = new HikariConfig();
        config.setDataSourceClassName("org.postgresql.ds.PGSimpleDataSource");
        
        // Pass sanitized values
        config.addDataSourceProperty("url", sanitizedUrl);
        config.addDataSourceProperty("user", sanitizedUser);
        config.addDataSourceProperty("password", sanitizedPass);
        
        String sslMode = (sanitizedUrl.contains("localhost") || sanitizedUrl.contains("127.0.0.1")) ? "prefer" : "require";
        config.addDataSourceProperty("sslmode", sslMode);
        
        // Hikari Specifics
        config.setConnectionTimeout(30000);
        config.setMaxLifetime(1800000);
        config.setMaximumPoolSize(10);
        config.setPoolName("CosmosHikariPool");

        String debugUrl = sanitizedUrl.contains("@") ? sanitizedUrl.split("@")[1] : sanitizedUrl;
        System.out.println("Configuring pool for: " + debugUrl);
        
        DataSource ds = new HikariDataSource(config);
        
        // Immediate connection verification for the developer
        try (java.sql.Connection conn = ds.getConnection()) {
            System.out.println("✅ COSMOS DATABASE CONNECTED SUCCESSFULLY! [Target: " + debugUrl + "]");
        } catch (Exception e) {
            System.err.println("❌ COSMOS DATABASE CONNECTION FAILED!");
            System.err.println("   Reason: " + e.getMessage());
            System.err.println("   Please ensure your PostgreSQL server is running and the 'cosmos' database exists.");
        }
        
        return ds;
    }
}
