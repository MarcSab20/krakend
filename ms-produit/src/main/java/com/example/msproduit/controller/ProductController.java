package com.example.msproduit.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @GetMapping
    public List<Map<String, Object>> getProducts() {
        return List.of(
            Map.of(
                "id", 1,
                "name", "Product 1", 
                "price", 19.99,
                "description", "This is product 1"
            ),
            Map.of(
                "id", 2,
                "name", "Product 2", 
                "price", 29.99,
                "description", "This is product 2"
            ),
            Map.of(
                "id", 3,
                "name", "Product 3", 
                "price", 39.99,
                "description", "This is product 3"
            )
        );
    }
}