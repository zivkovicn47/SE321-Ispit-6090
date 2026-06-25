package com.autoparts.dto;

import lombok.Data;

@Data
public class CreateEmployeeRequest {
    private String username;
    private String email;
    private String password;
    private String phone;
}
