package com.autoparts.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "special_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpecialOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String clientName;
    private String clientEmail;
    private String clientPhone;

    private String carBrand;
    private String carModel;
    private Integer carYear;
    private String carVin;

    @Column(length = 2000)
    private String partDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SpecialOrderStatus status;

    @Column(length = 2000)
    private String adminNote;

    private LocalDateTime createdAt;

    public enum SpecialOrderStatus {
        PENDING, CONFIRMED, REJECTED
    }
}
