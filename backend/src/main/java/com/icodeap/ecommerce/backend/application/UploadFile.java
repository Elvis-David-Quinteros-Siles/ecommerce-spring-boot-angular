package com.icodeap.ecommerce.backend.application;

import io.minio.GetObjectArgs;
import io.minio.GetObjectResponse;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@Slf4j
public class UploadFile {
    public static final String IMG_DEFAULT = "default.jpg";

    private final MinioClient minioClient;
    private final String bucket;
    private final String url;

    public UploadFile(MinioClient minioClient, String bucket, String url) {
        this.minioClient = minioClient;
        this.bucket = bucket;
        this.url = url.endsWith("/") ? url : url + "/";
    }

    public String upload (MultipartFile multipartFile) throws IOException {
        if (multipartFile!=null){
            String nameFile = multipartFile.getOriginalFilename();
            try (InputStream inputStream = multipartFile.getInputStream()) {
                minioClient.putObject(PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(nameFile)
                        .stream(inputStream, multipartFile.getSize(), -1)
                        .contentType(multipartFile.getContentType())
                        .build());
            } catch (Exception e) {
                throw new IOException("No se pudo subir la imagen a MinIO: " + nameFile, e);
            }
            return url+nameFile;
        }
        return  url+IMG_DEFAULT;
    }

    public void delete(String nameFile){
        try {
            minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(nameFile).build());
        } catch (Exception e) {
            log.warn("No se pudo eliminar la imagen {} de MinIO: {}", nameFile, e.getMessage());
        }
    }

    public GetObjectResponse download(String nameFile) throws Exception {
        return minioClient.getObject(GetObjectArgs.builder().bucket(bucket).object(nameFile).build());
    }

    public static String getNameFile(String urlImage){
        return urlImage.substring(urlImage.lastIndexOf('/') + 1);
    }

}
