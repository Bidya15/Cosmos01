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
        System.out.println("--- DATABASE INITIALIZATION (PGSimpleDataSource Mode) ---");
        
        // We will carefully parse the URL if it's provided, or just use properties
        // For Neon, it's often easier to just use the URL but we bypass Hikari's check
        
        HikariConfig config = new HikariConfig();
        
        // Instead of config.setJdbcUrl(cleanUrl), we use the DataSource class directly
        config.setDataSourceClassName("org.postgresql.ds.PGSimpleDataSource");
        
        // Sanitize and Add Properties to the DataSource
        config.addDataSourceProperty("url", dbUrl.trim());
        config.addDataSourceProperty("user", username.trim());
        config.addDataSourceProperty("password", password.trim());
        
        // Essential for Neon
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
