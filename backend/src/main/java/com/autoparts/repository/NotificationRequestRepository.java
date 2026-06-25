package com.autoparts.repository;

import com.autoparts.entity.Article;
import com.autoparts.entity.NotificationRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRequestRepository extends JpaRepository<NotificationRequest, Long> {
    List<NotificationRequest> findByArticleAndNotifiedFalse(Article article);
}
