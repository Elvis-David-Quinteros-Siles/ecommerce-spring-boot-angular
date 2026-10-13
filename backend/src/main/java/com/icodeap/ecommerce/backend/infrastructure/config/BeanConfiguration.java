package com.icodeap.ecommerce.backend.infrastructure.config;

import com.icodeap.ecommerce.backend.application.*;
import com.icodeap.ecommerce.backend.domain.port.ICategoryRepository;
import com.icodeap.ecommerce.backend.domain.port.IOrderRepository;
import com.icodeap.ecommerce.backend.domain.port.IProductRepository;
import com.icodeap.ecommerce.backend.domain.port.IUserRepository;
import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class BeanConfiguration {
    @Bean
    public UserService userService(IUserRepository iUserRepository){
        return new UserService(iUserRepository);
    }

    @Bean
    public CategoryService categoryService(ICategoryRepository iCategoryRepository){
        return new CategoryService(iCategoryRepository);
    }

    @Bean
    public ProductService productService(IProductRepository iProductRepository, UploadFile uploadFile){
        return  new ProductService(iProductRepository, uploadFile);
    }
    @Bean
    public OrderService orderService(IOrderRepository iOrderRepository, IProductRepository iProductRepository){
        return new OrderService(iOrderRepository, iProductRepository);
    }
    @Bean
    public UploadFile uploadFile(MinioClient minioClient,
                                 @Value("${minio.bucket}") String bucket,
                                 @Value("${app.images.url}") String url){
        return new UploadFile(minioClient, bucket, url);
    }

    @Bean
    public RegistrationService registrationService(IUserRepository iUserRepository){
        return new RegistrationService(iUserRepository);
    }

}
