package com.autoparts.repository;

import com.autoparts.entity.Order;
import com.autoparts.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByStatus(Order.OrderStatus status);
    List<Order> findByClientOrderByCreatedAtDesc(User client);
    List<Order> findAllByOrderByCreatedAtDesc();
}
