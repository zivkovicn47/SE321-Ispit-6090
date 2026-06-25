package com.autoparts.controller;

import com.autoparts.dto.CreateEmployeeRequest;
import com.autoparts.entity.User;
import com.autoparts.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/employees")
    public ResponseEntity<User> createEmployee(@RequestBody CreateEmployeeRequest request) {
        return ResponseEntity.ok(adminService.createEmployee(request));
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }
}
