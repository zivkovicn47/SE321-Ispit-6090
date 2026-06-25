package com.autoparts.service;

import com.autoparts.dto.ArticleDto;
import com.autoparts.entity.Article;
import com.autoparts.entity.NotificationRequest;
import com.autoparts.repository.ArticleRepository;
import com.autoparts.repository.NotificationRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final NotificationRequestRepository notificationRequestRepository;

    public List<Article> getAll(String name, String category, String manufacturer,
                                BigDecimal minPrice, BigDecimal maxPrice) {
        return articleRepository.findByFilters(name, category, manufacturer, minPrice, maxPrice);
    }

    public Article getById(Long id) {
        return articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found"));
    }

    public Article create(ArticleDto dto) {
        Article article = Article.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .stock(dto.getStock())
                .category(dto.getCategory())
                .manufacturer(dto.getManufacturer())
                .partNumber(dto.getPartNumber())
                .imageUrl(dto.getImageUrl())
                .build();
        return articleRepository.save(article);
    }

    public Article update(Long id, ArticleDto dto) {
        Article article = getById(id);
        boolean wasOutOfStock = article.getStock() == 0;

        article.setName(dto.getName());
        article.setDescription(dto.getDescription());
        article.setPrice(dto.getPrice());
        article.setStock(dto.getStock());
        article.setCategory(dto.getCategory());
        article.setManufacturer(dto.getManufacturer());
        article.setPartNumber(dto.getPartNumber());
        article.setImageUrl(dto.getImageUrl());

        Article saved = articleRepository.save(article);

        if (wasOutOfStock && dto.getStock() > 0) {
            triggerNotifications(saved);
        }

        return saved;
    }

    public void delete(Long id) {
        articleRepository.deleteById(id);
    }

    private void triggerNotifications(Article article) {
        List<NotificationRequest> pending = notificationRequestRepository.findByArticleAndNotifiedFalse(article);
        for (NotificationRequest nr : pending) {
            nr.setNotified(true);
            notificationRequestRepository.save(nr);
        }
    }
}
