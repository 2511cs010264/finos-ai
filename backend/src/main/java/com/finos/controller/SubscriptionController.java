package com.finos.controller;

import com.finos.entity.Subscription;
import com.finos.repository.SubscriptionRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionController(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    private Long resolveUserId(Long paramUserId, HttpSession session) {
        Long sessionUserId = (Long) session.getAttribute("userId");
        return sessionUserId != null ? sessionUserId : paramUserId;
    }

    @GetMapping
    public ResponseEntity<?> getSubscriptions(@RequestParam(required = false) Long userId, HttpSession session) {
        Long targetId = resolveUserId(userId, session);
        if (targetId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User ID required."));
        }

        List<Subscription> subscriptions = subscriptionRepository.findByUserId(targetId);
        return ResponseEntity.ok(subscriptions);
    }

    @PostMapping
    public ResponseEntity<?> addSubscription(@RequestParam(required = false) Long userId,
                                             @RequestBody Subscription sub,
                                             HttpSession session) {
        Long targetId = resolveUserId(userId, session);
        if (targetId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User ID required."));
        }

        sub.setUserId(targetId);
        if (sub.getAnnualCost() == null && sub.getMonthlyCost() != null) {
            sub.setAnnualCost("yearly".equalsIgnoreCase(sub.getBillingCycle()) ? sub.getMonthlyCost() : sub.getMonthlyCost() * 12);
        }

        Subscription saved = subscriptionRepository.save(sub);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSubscription(@PathVariable Long id,
                                                @RequestParam(required = false) Long userId,
                                                HttpSession session) {
        Long targetId = resolveUserId(userId, session);
        if (targetId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User ID required."));
        }

        subscriptionRepository.findById(id).ifPresent(sub -> {
            if (sub.getUserId().equals(targetId)) {
                subscriptionRepository.delete(sub);
            }
        });

        return ResponseEntity.ok(Map.of("success", true));
    }
}
