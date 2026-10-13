package com.icodeap.ecommerce.backend.infrastructure.rest;

import com.icodeap.ecommerce.backend.application.UserService;
import com.icodeap.ecommerce.backend.domain.model.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
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
}
