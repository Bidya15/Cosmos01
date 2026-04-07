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
                
                HttpServletResponse res = (HttpServletResponse) response;
                HttpServletRequest req = (HttpServletRequest) request;
 
                String origin = req.getHeader("Origin");
                
                if (res.getHeader("Access-Control-Allow-Origin") == null) {
                    res.setHeader("Access-Control-Allow-Origin", origin != null ? origin : "*");
                    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE, PUT");
                    res.setHeader("Access-Control-Max-Age", "3600");
                    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, X-Requested-With, Origin, Access-Control-Request-Headers, Access-Control-Request-Method");
                    res.setHeader("Access-Control-Allow-Credentials", "true");
                    res.setHeader("Access-Control-Expose-Headers", "Authorization");
                }
 
                if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
                    res.setStatus(HttpServletResponse.SC_OK);
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
