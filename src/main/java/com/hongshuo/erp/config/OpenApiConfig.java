package com.hongshuo.erp.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("宏硕建设 ERP API")
                        .version("1.0")
                        .description("项目管理、物料、财务、库存、日志等 REST 接口"));
    }
}
