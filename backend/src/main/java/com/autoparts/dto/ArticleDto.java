package com.autoparts.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ArticleDto {
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stock;
    private String category;
    private String manufacturer;
    private String partNumber;
    private String imageUrl;
}
