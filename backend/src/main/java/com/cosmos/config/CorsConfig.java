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
 
    /**
     * The Nuclear Option: Manual Jakarta Servlet Filter.
     * This bypasses all Spring abstractions and manually writes CORS headers 
     * directly to the raw HttpServletResponse.
     */
    @Bean
    public FilterRegistrationBean<Filter> manualCorsFilter() {
        Filter filter = new Filter() {
            @Override
            public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) 
                    throws IOException, ServletException {
                
                HttpServletResponse res = (HttpServletResponse) response;
                HttpServletRequest req = (HttpServletRequest) request;
 
                // 1. Dynamic Origin Reflection (Most compatible with Credentials=true)
                String origin = req.getHeader("Origin");
                res.setHeader("Access-Control-Allow-Origin", origin != null ? origin : "*");
                
                // 2. Mandatory CORS Headers
                res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE, PUT");
                res.setHeader("Access-Control-Allow-Max-Age", "3600");
                res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, X-Requested-With, Origin");
                res.setHeader("Access-Control-Allow-Credentials", "true");
                res.setHeader("Access-Control-Expose-Headers", "Authorization");
 
                // 3. Force 200 OK for Preflight (OPTIONS)
                if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
                    res.setStatus(HttpServletResponse.SC_OK);
                } else {
                    chain.doFilter(request, response);
                }
            }
        };
 
        FilterRegistrationBean<Filter> bean = new FilterRegistrationBean<>(filter);
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE); // Absolute priority
        bean.addUrlPatterns("/*");
        return bean;
    }
}
