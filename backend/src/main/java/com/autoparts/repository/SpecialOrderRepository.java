package com.autoparts.repository;

import com.autoparts.entity.SpecialOrder;
import com.autoparts.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpecialOrderRepository extends JpaRepository<SpecialOrder, Long> {
    List<SpecialOrder> findByUserOrderByCreatedAtDesc(User user);
    List<SpecialOrder> findAllByOrderByCreatedAtDesc();
}
