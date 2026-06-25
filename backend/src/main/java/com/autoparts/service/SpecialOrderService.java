package com.autoparts.service;

import com.autoparts.dto.SpecialOrderRequest;
import com.autoparts.entity.*;
import com.autoparts.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SpecialOrderService {

    private final SpecialOrderRepository specialOrderRepository;
    private final UserRepository userRepository;

    public SpecialOrder create(SpecialOrderRequest req, String username) {
        User user = null;
        if (username != null) {
            user = userRepository.findByUsername(username).orElse(null);
        }

        SpecialOrder so = SpecialOrder.builder()
                .user(user)
                .clientName(req.getClientName())
                .clientEmail(req.getClientEmail())
                .clientPhone(req.getClientPhone())
                .carBrand(req.getCarBrand())
                .carModel(req.getCarModel())
                .carYear(req.getCarYear())
                .carVin(req.getCarVin())
                .partDescription(req.getPartDescription())
                .status(SpecialOrder.SpecialOrderStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        return specialOrderRepository.save(so);
    }

    public List<SpecialOrder> getAll() {
        return specialOrderRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<SpecialOrder> getMy(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return specialOrderRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public SpecialOrder respond(Long id, SpecialOrder.SpecialOrderStatus status, String note) {
        SpecialOrder so = specialOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Special order not found"));
        so.setStatus(status);
        so.setAdminNote(note);
        return specialOrderRepository.save(so);
    }
}
