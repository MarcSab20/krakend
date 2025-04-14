package com.example.mscommande.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @GetMapping
    public List<Map<String, Object>> getOrders() {
        return List.of(
            Map.of(
                "id", 1,
                "customerName", "John Doe",
                "orderDate", LocalDate.now().toString(),
                "total", 59.97,
                "items", List.of(
                    Map.of("productId", 1, "quantity", 2, "price", 19.99),
                    Map.of("productId", 2, "quantity", 1, "price", 29.99)
                )
            ),
            Map.of(
                "id", 2,
                "customerName", "Jane Smith",
                "orderDate", LocalDate.now().minusDays(1).toString(),
                "total", 39.99,
                "items", List.of(
                    Map.of("productId", 3, "quantity", 1, "price", 39.99)
                )
            )
        );
    }
}