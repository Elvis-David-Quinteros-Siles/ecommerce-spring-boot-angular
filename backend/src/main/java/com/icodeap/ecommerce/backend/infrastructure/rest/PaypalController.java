package com.icodeap.ecommerce.backend.infrastructure.rest;

import com.icodeap.ecommerce.backend.application.OrderService;
import com.icodeap.ecommerce.backend.application.UserService;
import com.icodeap.ecommerce.backend.domain.model.DataPayment;
import com.icodeap.ecommerce.backend.domain.model.Order;
import com.icodeap.ecommerce.backend.domain.model.OrderState;
import com.icodeap.ecommerce.backend.domain.model.URLPaypalResponse;
import com.icodeap.ecommerce.backend.infrastructure.service.PaypalService;
import com.paypal.api.payments.Links;
import com.paypal.api.payments.Payment;
import com.paypal.api.payments.Transaction;
import com.paypal.base.rest.PayPalRESTException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.math.BigDecimal;
import java.math.RoundingMode;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
@Slf4j
@RequestMapping("/api/v1/payments")
public class PaypalController {
    private static final String CURRENCY = "USD";

    private final PaypalService paypalService;
    private final OrderService orderService;
    private final UserService userService;
    private final String SUCCESS_URL;
    private  final String CANCEL_URL;
    private final String FRONTEND_URL;

    public PaypalController(PaypalService paypalService,
                            OrderService orderService,
                            UserService userService,
                            @Value("${app.backend.url}") String backendUrl,
                            @Value("${app.frontend.url}") String frontendUrl) {
        this.paypalService = paypalService;
        this.orderService = orderService;
        this.userService = userService;
        this.SUCCESS_URL = backendUrl + "/api/v1/payments/success";
        this.CANCEL_URL = backendUrl + "/api/v1/payments/cancel";
        this.FRONTEND_URL = frontendUrl;
    }

    // Inicia el pago de una orden pendiente del usuario. El monto sale de la orden, no del cliente.
    @PostMapping
    public ResponseEntity<URLPaypalResponse> createPayment(@RequestBody DataPayment dataPayment, Authentication authentication){
        if (dataPayment.getOrderId() == null) {
            return ResponseEntity.badRequest().build();
        }
        Order order;
        try {
            order = orderService.findById(dataPayment.getOrderId());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
        Integer userId = userService.findByEmail(authentication.getName()).getId();
        if (!order.getUserId().equals(userId)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        if (order.getOrderState() != OrderState.CANCELLED) {
            // Ya esta pagada
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }

        try {
            Payment payment = paypalService.createPayment(
                    orderTotal(order).doubleValue(),
                    CURRENCY,
                    "paypal",
                    "sale",
                    "Orden #" + order.getId(),
                    CANCEL_URL + "?orderId=" + order.getId(),
                    SUCCESS_URL + "?orderId=" + order.getId(),
                    String.valueOf(order.getId())
            );
            for (Links links : payment.getLinks()){
                if(links.getRel().equals("approval_url")){
                    return ResponseEntity.ok(new URLPaypalResponse( links.getHref()));
                }
            }
        } catch (PayPalRESTException e) {
            log.error("Error al crear el pago de la orden {}: {}", order.getId(), e.getMessage());
        }
        return new ResponseEntity<>(HttpStatus.BAD_GATEWAY);
    }

    // PayPal redirige aqui tras aprobar. Solo se confirma la orden si el pago se ejecuta,
    // queda aprobado y corresponde exactamente a esa orden y a su monto.
    @GetMapping("/success")
    public RedirectView paymentSuccess(
            @RequestParam("paymentId") String paymentId,
            @RequestParam("PayerID") String payerId,
            @RequestParam("orderId") Integer orderId
    ){
        String result = FRONTEND_URL + "/payment/success?orderId=" + orderId;
        try {
            Order order = orderService.findById(orderId);
            if (order.getOrderState() == OrderState.CONFIRMED) {
                return new RedirectView(result);
            }
            Payment payment = paypalService.executePayment(paymentId, payerId);
            if (isValidPayment(payment, order)) {
                orderService.updateStateById(orderId, OrderState.CONFIRMED.name());
                log.info("Orden {} confirmada con el pago {}", orderId, paymentId);
            } else {
                log.warn("Pago {} no valido para la orden {}", paymentId, orderId);
            }
        } catch (PayPalRESTException | RuntimeException e) {
            log.error("Error al confirmar el pago {} de la orden {}: {}", paymentId, orderId, e.getMessage());
        }
        return new RedirectView(result);
    }

    @GetMapping("/cancel")
    public  RedirectView patmentCancel(){
        return new RedirectView(FRONTEND_URL + "/cart/sumary");
    }

    private boolean isValidPayment(Payment payment, Order order){
        if (!"approved".equals(payment.getState()) || payment.getTransactions() == null || payment.getTransactions().size() != 1) {
            return false;
        }
        Transaction transaction = payment.getTransactions().get(0);
        return String.valueOf(order.getId()).equals(transaction.getCustom())
                && CURRENCY.equals(transaction.getAmount().getCurrency())
                && new BigDecimal(transaction.getAmount().getTotal()).compareTo(orderTotal(order)) == 0;
    }

    private BigDecimal orderTotal(Order order){
        return order.getTotalOrderPrice().setScale(2, RoundingMode.HALF_UP);
    }

}
