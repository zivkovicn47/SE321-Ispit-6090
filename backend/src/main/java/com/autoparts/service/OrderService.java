package com.autoparts.service;

import com.autoparts.dto.OrderRequest;
import com.autoparts.entity.*;
import com.autoparts.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;

    public Order create(OrderRequest request, String username) {
        // 1. Korpa mora sadržati bar jedan artikal
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Korpa ne sme biti prazna");
        }

        // 2. Ako je korisnik prijavljen, mora postojati u bazi
        User client = null;
        if (username != null) {
            client = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Klijent nije pronađen: " + username));
        }

        Order order = Order.builder()
                .client(client)
                .guestName(request.getGuestName())
                .guestEmail(request.getGuestEmail())
                .guestPhone(request.getGuestPhone())
                .status(Order.OrderStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .deliveryAddress(request.getDeliveryAddress())
                .createdAt(LocalDateTime.now())
                .build();

        List<OrderItem> items = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (var itemReq : request.getItems()) {
            Article article = articleRepository.findById(itemReq.getArticleId())
                    .orElseThrow(() -> new RuntimeException("Article not found: " + itemReq.getArticleId()));

            // 3. Proveravamo da li ima dovoljno stanja na lageru
            if (article.getStock() < itemReq.getQuantity()) {
                throw new RuntimeException(
                        "Nedovoljno stanja za artikal '" + article.getName() +
                        "': traženo=" + itemReq.getQuantity() + ", dostupno=" + article.getStock());
            }

            OrderItem item = OrderItem.builder()
                    .order(order)
                    .article(article)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(article.getPrice())
                    .build();
            items.add(item);
            total = total.add(article.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity())));

            // 4. Umanjujemo stanje artikla
            article.setStock(article.getStock() - itemReq.getQuantity());
            articleRepository.save(article);
        }

        order.setItems(items);
        order.setTotalPrice(total);
        return orderRepository.save(order);
    }

    public List<Order> getAll() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Order> getByStatus(Order.OrderStatus status) {
        return orderRepository.findByStatus(status);
    }

    public List<Order> getMyOrders(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return orderRepository.findByClientOrderByCreatedAtDesc(user);
    }

    public Order updateStatus(Long id, Order.OrderStatus newStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Finalni statusi — nije moguće više menjati status
        if (order.getStatus() == Order.OrderStatus.DELIVERED) {
            throw new RuntimeException(
                    "Isporučena porudžbina ne može promeniti status (trenutno: DELIVERED)");
        }
        if (order.getStatus() == Order.OrderStatus.CANCELLED) {
            throw new RuntimeException(
                    "Otkazana porudžbina ne može promeniti status (trenutno: CANCELLED)");
        }

        order.setStatus(newStatus);
        return orderRepository.save(order);
    }
}
