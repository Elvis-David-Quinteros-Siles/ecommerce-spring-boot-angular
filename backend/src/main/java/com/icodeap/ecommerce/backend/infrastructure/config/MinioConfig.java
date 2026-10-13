package com.icodeap.ecommerce.backend.infrastructure.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.errors.ErrorResponseException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import java.io.InputStream;

@Configuration
@Slf4j
public class MinioConfig {
    @Value("${minio.url}")
    private String url;
    @Value("${minio.access-key}")
    private String accessKey;
    @Value("${minio.secret-key}")
    private String secretKey;
    @Value("${minio.bucket}")
    private String bucket;

    @Bean
    public MinioClient minioClient(){
        return MinioClient.builder().endpoint(url).credentials(accessKey, secretKey).build();
    }

    // Crea el bucket si no existe y sube las imagenes iniciales (static/images) que falten
    @Bean
    public ApplicationRunner minioInitializer(MinioClient minioClient){
        return args -> {
            try {
                if (!minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build())) {
                    minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                    log.info("Bucket MinIO creado: {}", bucket);
                }
                Resource[] images = new PathMatchingResourcePatternResolver().getResources("classpath:static/images/*");
                for (Resource image : images) {
                    String name = image.getFilename();
                    if (name == null || exists(minioClient, name)) {
                        continue;
                    }
                    try (InputStream inputStream = image.getInputStream()) {
                        minioClient.putObject(PutObjectArgs.builder()
                                .bucket(bucket).object(name)
                                .stream(inputStream, image.contentLength(), -1)
                                .contentType("image/jpeg")
                                .build());
                        log.info("Imagen inicial subida a MinIO: {}", name);
                    }
                }
            } catch (Exception e) {
                log.error("No se pudo inicializar MinIO ({}): {}", url, e.getMessage());
            }
        };
    }

    private boolean exists(MinioClient minioClient, String name) throws Exception {
        try {
            minioClient.statObject(StatObjectArgs.builder().bucket(bucket).object(name).build());
            return true;
        } catch (ErrorResponseException e) {
            return false;
        }
    }
}
