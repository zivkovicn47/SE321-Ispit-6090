package com.autoparts.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String guestContact;

    @ManyToOne
    @JoinColumn(name = "article_id")
    private Article article;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    private String contactValue;

    private boolean notified;

    private LocalDateTime createdAt;

    public enum NotificationType {
        EMAIL, PHONE
    }
}
