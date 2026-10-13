package com.icodeap.ecommerce.backend.application;

import com.icodeap.ecommerce.backend.domain.model.Order;
import com.icodeap.ecommerce.backend.domain.model.OrderProduct;
import com.icodeap.ecommerce.backend.domain.model.OrderState;
import com.icodeap.ecommerce.backend.domain.port.IOrderRepository;
import com.icodeap.ecommerce.backend.domain.port.IProductRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class OrderService {

    private  final IOrderRepository iOrderRepository;
    private final IProductRepository iProductRepository;

    public OrderService(IOrderRepository iOrderRepository, IProductRepository iProductRepository) {
        this.iOrderRepository = iOrderRepository;
        this.iProductRepository = iProductRepository;
    }

    // Crea una orden pendiente de pago para el usuario autenticado. Los precios se toman
    // del catalogo: nunca se confia en el usuario, el estado ni los precios que envia el cliente.
    public Order createForUser(Order order, Integer userId){
        if (order.getOrderProducts() == null || order.getOrderProducts().isEmpty()) {
            throw new IllegalArgumentException("La orden no tiene productos");
        }
        for (OrderProduct orderProduct : order.getOrderProducts()) {
            if (orderProduct.getQuantity() == null || orderProduct.getQuantity().compareTo(BigDecimal.ONE) < 0) {
                throw new IllegalArgumentException("Cantidad invalida");
            }
            orderProduct.setId(null);
            orderProduct.setPrice(iProductRepository.findById(orderProduct.getProductId()).getPrice());
        }
        order.setId(null);
        order.setUserId(userId);
        order.setDateCreated(LocalDateTime.now());
        order.setOrderState(OrderState.CANCELLED);
        return this.iOrderRepository.save(order);
    }

    public Iterable<Order> findAll(){
        return this.iOrderRepository.findAll();
    }

    public Iterable<Order> findByUserId(Integer userId){
        return this.iOrderRepository.findByUserId(userId);
    }
    public void updateStateById(Integer id, String state){
        this.iOrderRepository.updateStateById(id, state);
    }

    public Order findById(Integer id){
        return  this.iOrderRepository.findById(id);
    }


}
