package com.autoparts.service;

import com.autoparts.dto.NotificationRequestDto;
import com.autoparts.entity.*;
import com.autoparts.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRequestRepository notificationRequestRepository;
    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;

    public NotificationRequest create(NotificationRequestDto dto, String username) {
        Article article = articleRepository.findById(dto.getArticleId())
                .orElseThrow(() -> new RuntimeException("Article not found"));

        User user = null;
        if (username != null) {
            user = userRepository.findByUsername(username).orElse(null);
        }

        NotificationRequest nr = NotificationRequest.builder()
                .article(article)
                .user(user)
                .type(dto.getType())
                .contactValue(dto.getContactValue())
                .notified(false)
                .createdAt(LocalDateTime.now())
                .build();

        return notificationRequestRepository.save(nr);
    }
}
