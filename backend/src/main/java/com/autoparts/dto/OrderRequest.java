package com.autoparts.dto;

import com.autoparts.entity.Order;
import lombok.Data;

import java.util.List;

@Data
public class OrderRequest {
    private List<OrderItemRequest> items;
    private Order.PaymentMethod paymentMethod;
    private String deliveryAddress;
    private String guestName;
    private String guestEmail;
    private String guestPhone;
}
