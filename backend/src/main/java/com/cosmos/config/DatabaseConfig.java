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
        
        config.addDataSourceProperty("sslmode", "require");
        
        // Hikari Specifics
        config.setConnectionTimeout(30000);
        config.setMaxLifetime(1800000);
        config.setMaximumPoolSize(10);
        config.setPoolName("CosmosHikariPool");

        System.out.println("Configuring pool for: " + dbUrl.trim().split("@")[1]);
        
        return new HikariDataSource(config);
    }
}
