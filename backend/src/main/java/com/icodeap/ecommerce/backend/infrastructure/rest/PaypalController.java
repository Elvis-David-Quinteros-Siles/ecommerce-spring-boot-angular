package com.icodeap.ecommerce.backend.infrastructure.rest;

import com.icodeap.ecommerce.backend.domain.model.DataPayment;
import com.icodeap.ecommerce.backend.domain.model.URLPaypalResponse;
import com.icodeap.ecommerce.backend.infrastructure.service.PaypalService;
import com.paypal.api.payments.Links;
import com.paypal.api.payments.Payment;
import com.paypal.base.rest.PayPalRESTException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
@Slf4j
@RequestMapping("/api/v1/payments")
public class PaypalController {
    private final PaypalService paypalService;
    private final String SUCCESS_URL;
    private  final String CANCEL_URL;
    private final String FRONTEND_URL;

    public PaypalController(PaypalService paypalService,
                            @Value("${app.backend.url}") String backendUrl,
                            @Value("${app.frontend.url}") String frontendUrl) {
        this.paypalService = paypalService;
        this.SUCCESS_URL = backendUrl + "/api/v1/payments/success";
        this.CANCEL_URL = backendUrl + "/api/v1/payments/cancel";
        this.FRONTEND_URL = frontendUrl;
    }

    @PostMapping
    public URLPaypalResponse createPayment(@RequestBody DataPayment dataPayment){
        log.info("dat {}", dataPayment);
        try {
            Payment payment = paypalService.createPayment(
                    Double.valueOf(dataPayment.getAmount()),
                    dataPayment.getCurrency(),
                    dataPayment.getMethod(),
                    "sale",
                    dataPayment.getDescription(),
                    CANCEL_URL,
                    SUCCESS_URL
            );
            for (Links links : payment.getLinks()){
                if(links.getRel().equals("approval_url")){
                    return new URLPaypalResponse( links.getHref());
                }
            }
        } catch (PayPalRESTException e) {
            e.printStackTrace();
        }

        return new URLPaypalResponse(FRONTEND_URL) ;

    }
    @GetMapping("/success")
    public RedirectView paymentSuccess(
            @RequestParam("paymentId") String paymentId,
            @RequestParam("PayerID") String payerId
    ){
        try {
            Payment payment = paypalService.executePayment(paymentId, payerId);
            if (payment.getState().equals("approved")){
                return new RedirectView(FRONTEND_URL + "/payment/success");
                //return new RedirectView(FRONTEND_URL);
            }
        } catch (PayPalRESTException e) {
            e.printStackTrace();
        }
        return new RedirectView(FRONTEND_URL);
    }

    @GetMapping("/cancel")
    public  RedirectView patmentCancel(){
        return new RedirectView(FRONTEND_URL);
    }

}
