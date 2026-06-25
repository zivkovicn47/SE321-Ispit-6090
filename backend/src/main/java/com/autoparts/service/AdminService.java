package com.autoparts.service;

import com.autoparts.dto.CreateEmployeeRequest;
import com.autoparts.entity.User;
import com.autoparts.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User createEmployee(CreateEmployeeRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new RuntimeException("Username already taken");
        }
        User employee = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .phone(req.getPhone())
                .role(User.Role.EMPLOYEE)
                .build();
        return userRepository.save(employee);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}
