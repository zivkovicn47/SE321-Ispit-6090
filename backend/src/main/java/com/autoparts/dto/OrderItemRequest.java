package com.autoparts.dto;

import lombok.Data;

@Data
public class OrderItemRequest {
    private Long articleId;
    private Integer quantity;
}
