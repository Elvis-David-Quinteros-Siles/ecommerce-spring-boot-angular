package com.icodeap.ecommerce.backend.infrastructure.rest;

import com.icodeap.ecommerce.backend.application.UploadFile;
import io.minio.GetObjectResponse;
import io.minio.errors.ErrorResponseException;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/images")
@AllArgsConstructor
@Slf4j
public class ImageController {
    private final UploadFile uploadFile;

    @GetMapping("/{nameFile:.+}")
    public ResponseEntity<InputStreamResource> getImage(@PathVariable String nameFile){
        try {
            GetObjectResponse object = uploadFile.download(nameFile);
            String contentType = object.headers().get(HttpHeaders.CONTENT_TYPE);
            return ResponseEntity.ok()
                    .contentType(contentType != null ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM)
                    .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS))
                    .body(new InputStreamResource(object));
        } catch (ErrorResponseException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error al obtener la imagen {}: {}", nameFile, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
