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
        
        String sanitizedUrl = dbUrl.replaceAll("[^\\x20-\\x7e]", "").trim();
        String sanitizedUser = username.replaceAll("[^\\x20-\\x7e]", "").trim();
        String sanitizedPass = password.replaceAll("[^\\x20-\\x7e]", "").trim();
        
        StringBuilder hex = new StringBuilder();
        for (int i = 0; i < Math.min(sanitizedUrl.length(), 10); i++) {
            hex.append(String.format("%02x ", (int) sanitizedUrl.charAt(i)));
        }
        System.out.println("URL Hex (First 10): " + hex.toString());
        String finalUrl = sanitizedUrl;
        if (sanitizedUrl.contains("@")) {
            String[] parts = sanitizedUrl.split("@");
            String prefix = "jdbc:postgresql://";
            finalUrl = prefix + parts[1];
            System.out.println("Stripped inline credentials from URL for driver compatibility.");
        }
        
        HikariConfig config = new HikariConfig();
        config.setDataSourceClassName("org.postgresql.ds.PGSimpleDataSource");
        
        config.addDataSourceProperty("url", finalUrl);
        config.addDataSourceProperty("user", sanitizedUser);
        config.addDataSourceProperty("password", sanitizedPass);
        
        String sslMode = (finalUrl.contains("localhost") || finalUrl.contains("127.0.0.1")) ? "prefer" : "require";
        config.addDataSourceProperty("sslmode", sslMode);
        
        config.setConnectionTimeout(30000);
        config.setMaxLifetime(1800000);
        config.setMaximumPoolSize(10);
        config.setPoolName("CosmosHikariPool");

        String debugUrl = finalUrl.contains("@") ? finalUrl.split("@")[1] : finalUrl;
        System.out.println("Configuring pool for: " + debugUrl);
        
        DataSource ds = new HikariDataSource(config);
        
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
