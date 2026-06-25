package com.autoparts.dto;

import lombok.Data;

@Data
public class SpecialOrderRequest {
    private String clientName;
    private String clientEmail;
    private String clientPhone;
    private String carBrand;
    private String carModel;
    private Integer carYear;
    private String carVin;
    private String partDescription;
}
