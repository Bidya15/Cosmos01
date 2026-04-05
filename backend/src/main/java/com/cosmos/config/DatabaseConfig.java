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
        // CLEANING THE URL: This is the critical part to fix hidden spaces or characters
        String cleanUrl = dbUrl.trim()
                .replace("\n", "")
                .replace("\r", "")
                .replace("\t", "");

        System.out.println("--- DATABASE INITIALIZATION ---");
        System.out.println("Using URL: " + cleanUrl);
        System.out.println("Connecting as: " + username.trim());
        
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(cleanUrl);
        config.setUsername(username.trim());
        config.setPassword(password.trim());
        config.setDriverClassName("org.postgresql.Driver");
        
        // Performance settings for Neon
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        config.setMinimumIdle(1);
        config.setMaximumPoolSize(10);
        
        return new HikariDataSource(config);
    }
}
