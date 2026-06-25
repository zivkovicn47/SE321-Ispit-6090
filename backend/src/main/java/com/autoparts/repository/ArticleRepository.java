package com.autoparts.repository;

import com.autoparts.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface ArticleRepository extends JpaRepository<Article, Long> {

    @Query("SELECT a FROM Article a WHERE " +
           "(:name IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:category IS NULL OR a.category = :category) AND " +
           "(:manufacturer IS NULL OR LOWER(a.manufacturer) LIKE LOWER(CONCAT('%', :manufacturer, '%'))) AND " +
           "(:minPrice IS NULL OR a.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR a.price <= :maxPrice)")
    List<Article> findByFilters(@Param("name") String name,
                                @Param("category") String category,
                                @Param("manufacturer") String manufacturer,
                                @Param("minPrice") BigDecimal minPrice,
                                @Param("maxPrice") BigDecimal maxPrice);

    List<Article> findAllByStockGreaterThan(int stock);
}
