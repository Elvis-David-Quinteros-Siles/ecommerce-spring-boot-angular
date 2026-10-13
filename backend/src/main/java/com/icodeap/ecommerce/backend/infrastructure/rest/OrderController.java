package com.icodeap.ecommerce.backend.infrastructure.rest;

import com.icodeap.ecommerce.backend.application.OrderService;
import com.icodeap.ecommerce.backend.application.UserService;
import com.icodeap.ecommerce.backend.domain.model.Order;
import com.icodeap.ecommerce.backend.domain.model.OrderState;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/v1/orders")
@CrossOrigin(origins = "http://localhost:4200")
@Slf4j
public class OrderController {
    private final OrderService orderService;
    private final UserService userService;

    public OrderController(OrderService orderService, UserService userService) {
        this.orderService = orderService;
        this.userService = userService;
    }

    // La orden se crea a nombre del usuario autenticado, pendiente de pago y con precios del catalogo
    @PostMapping
    public ResponseEntity<Order> save(@RequestBody Order order, Authentication authentication){
        try {
            return ResponseEntity.ok(orderService.createForUser(order, currentUserId(authentication)));
        } catch (RuntimeException e) {
            log.info("Orden rechazada: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Cambio manual de estado: solo ADMIN. Los clientes confirman pagando (ver PaypalController)
    @PostMapping("/update/state/order")
    public ResponseEntity updateStateById(@RequestParam Integer id, @RequestParam String state, Authentication authentication){
        if (!isAdmin(authentication)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        if (Arrays.stream(OrderState.values()).noneMatch(s -> s.name().equals(state))) {
            return ResponseEntity.badRequest().build();
        }
        orderService.updateStateById(id, state);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<Iterable<Order>> findAll(Authentication authentication){
        if (!isAdmin(authentication)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(orderService.findAll());
    }

    @GetMapping("{variable}")
    public ResponseEntity<Order> findById(@PathVariable("variable") Integer id, Authentication authentication){
        Order order = orderService.findById(id);
        if (!isAdmin(authentication) && !order.getUserId().equals(currentUserId(authentication))) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        return  ResponseEntity.ok(order);
    }

    @GetMapping("/by-user/{id}")
    public ResponseEntity<Iterable<Order>> findByUserId(@PathVariable("id") Integer userId, Authentication authentication){
        if (!isAdmin(authentication) && !userId.equals(currentUserId(authentication))) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(orderService.findByUserId(userId));
    }

    private Integer currentUserId(Authentication authentication){
        return userService.findByEmail(authentication.getName()).getId();
    }

    private boolean isAdmin(Authentication authentication){
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
    }

}
