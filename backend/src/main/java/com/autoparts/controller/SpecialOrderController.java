package com.autoparts.controller;

import com.autoparts.dto.SpecialOrderRequest;
import com.autoparts.entity.SpecialOrder;
import com.autoparts.service.SpecialOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/special-orders")
@RequiredArgsConstructor
public class SpecialOrderController {

    private final SpecialOrderService specialOrderService;

    @PostMapping
    public ResponseEntity<SpecialOrder> create(
            @RequestBody SpecialOrderRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(specialOrderService.create(request, username));
    }

    @GetMapping("/all")
    public ResponseEntity<List<SpecialOrder>> getAll() {
        return ResponseEntity.ok(specialOrderService.getAll());
    }

    @GetMapping("/my")
    public ResponseEntity<List<SpecialOrder>> getMy(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(specialOrderService.getMy(userDetails.getUsername()));
    }

    @PutMapping("/{id}/respond")
    public ResponseEntity<SpecialOrder> respond(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        SpecialOrder.SpecialOrderStatus status =
                SpecialOrder.SpecialOrderStatus.valueOf(body.get("status"));
        String note = body.get("note");
        return ResponseEntity.ok(specialOrderService.respond(id, status, note));
    }
}
