package com.icodeap.ecommerce.backend.infrastructure.rest;

import com.icodeap.ecommerce.backend.application.UserService;
import com.icodeap.ecommerce.backend.domain.model.User;
import com.icodeap.ecommerce.backend.infrastructure.dto.ChangePasswordDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "http://localhost:4200")
@Slf4j
public class UserController {
    private static final int MIN_PASSWORD_LENGTH = 6;

    private final UserService userService;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserController(UserService userService, BCryptPasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
    }

    // Se elimino POST /api/v1/users: permitia a cualquier usuario autenticado crear o
    // sobrescribir cuentas (incluido el rol y la contrasena). El alta va por /api/v1/security/register.

    // Cada usuario solo puede consultar sus propios datos; un ADMIN puede consultar cualquiera
    @GetMapping("/{id}")
    public ResponseEntity<User> findById(@PathVariable Integer id, Authentication authentication){
        User current = userService.findByEmail(authentication.getName());
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !current.getId().equals(id)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        User user = current.getId().equals(id) ? current : userService.findById(id);
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }

    // Cambio de contrasena del usuario autenticado. Responde 400 (no 401) si la actual es
    // incorrecta, para que el frontend no lo confunda con una sesion expirada.
    @PutMapping("/me/password")
    public ResponseEntity<Map<String, String>> changePassword(@RequestBody ChangePasswordDTO dto, Authentication authentication){
        if (dto.currentPassword() == null || dto.newPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Faltan datos"));
        }
        if (dto.newPassword().length() < MIN_PASSWORD_LENGTH) {
            return ResponseEntity.badRequest().body(Map.of("message", "La nueva contraseña debe tener al menos " + MIN_PASSWORD_LENGTH + " caracteres"));
        }
        User user = userService.findByEmail(authentication.getName());
        if (!passwordEncoder.matches(dto.currentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "La contraseña actual no es correcta"));
        }
        user.setPassword(passwordEncoder.encode(dto.newPassword()));
        userService.save(user);
        log.info("Contraseña actualizada para {}", user.getEmail());
        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada"));
    }
}
