package com.finos.controller;

import com.finos.entity.Budget;
import com.finos.repository.BudgetRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetRepository budgetRepository;

    public BudgetController(BudgetRepository budgetRepository) {
        this.budgetRepository = budgetRepository;
    }

    private Long resolveUserId(Long paramUserId, HttpSession session) {
        Long sessionUserId = (Long) session.getAttribute("userId");
        return sessionUserId != null ? sessionUserId : paramUserId;
    }

    @GetMapping
    public ResponseEntity<?> getBudgets(@RequestParam(required = false) Long userId, HttpSession session) {
        Long targetId = resolveUserId(userId, session);
        if (targetId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User ID required."));
        }

        List<Budget> budgets = budgetRepository.findByUserId(targetId);
        return ResponseEntity.ok(budgets);
    }

    @PostMapping
    public ResponseEntity<?> updateBudget(@RequestParam(required = false) Long userId,
                                          @RequestBody Map<String, Object> body,
                                          HttpSession session) {
        Long targetId = resolveUserId(userId, session);
        if (targetId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User ID required."));
        }

        String category = (String) body.get("category");
        Double allocatedAmount = Double.valueOf(body.get("allocatedAmount").toString());

        if (category == null || allocatedAmount == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Category and allocatedAmount required."));
        }

        Optional<Budget> existingOpt = budgetRepository.findByUserIdAndCategory(targetId, category);
        Budget budget;
        if (existingOpt.isPresent()) {
            budget = existingOpt.get();
            budget.setAllocatedAmount(allocatedAmount);
        } else {
            budget = new Budget(targetId, category, allocatedAmount);
        }

        Budget saved = budgetRepository.save(budget);
        return ResponseEntity.ok(saved);
    }
}
