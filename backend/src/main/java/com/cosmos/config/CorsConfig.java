package com.cosmos.config;
 
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import java.io.IOException;
 
@Configuration
public class CorsConfig {
 
    @Bean
    public FilterRegistrationBean<Filter> manualCorsFilter() {
        Filter filter = new Filter() {
            @Override
            public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) 
                    throws IOException, ServletException {
                
                HttpServletResponse httpResponse = (HttpServletResponse) response;
                HttpServletRequest httpRequest = (HttpServletRequest) request;
 
                String origin = httpRequest.getHeader("Origin");
                
                // This is a safety filter that ensures CORS headers are present even if a 
                // controller or error handler misses them. It avoids duplicate headers.
                if (httpResponse.getHeader("Access-Control-Allow-Origin") == null) {
                    httpResponse.setHeader("Access-Control-Allow-Origin", origin != null ? origin : "*");
                    httpResponse.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE, PUT");
                    httpResponse.setHeader("Access-Control-Max-Age", "3600");
                    httpResponse.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, X-Requested-With, Origin, Access-Control-Request-Headers, Access-Control-Request-Method");
                    httpResponse.setHeader("Access-Control-Allow-Credentials", "true");
                    httpResponse.setHeader("Access-Control-Expose-Headers", "Authorization");
                }
 
                // Instantly approve preflight 'OPTIONS' requests to keep the frontend happy
                if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
                    httpResponse.setStatus(HttpServletResponse.SC_OK);
                    return;
                }
 
                chain.doFilter(request, response);
            }
        };
 
        FilterRegistrationBean<Filter> bean = new FilterRegistrationBean<>(filter);
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        bean.addUrlPatterns("/*");
        return bean;
    }
}
