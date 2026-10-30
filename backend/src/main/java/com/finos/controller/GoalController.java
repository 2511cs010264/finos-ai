package com.finos.controller;

import com.finos.entity.Goal;
import com.finos.repository.GoalRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalRepository goalRepository;

    public GoalController(GoalRepository goalRepository) {
        this.goalRepository = goalRepository;
    }

    private Long resolveUserId(Long paramUserId, HttpSession session) {
        Long sessionUserId = (Long) session.getAttribute("userId");
        return sessionUserId != null ? sessionUserId : paramUserId;
    }

    @GetMapping
    public ResponseEntity<?> getGoals(@RequestParam(required = false) Long userId, HttpSession session) {
        Long targetId = resolveUserId(userId, session);
        if (targetId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User ID required."));
        }

        List<Goal> goals = goalRepository.findByUserId(targetId);
        return ResponseEntity.ok(goals);
    }

    @PostMapping
    public ResponseEntity<?> addGoal(@RequestParam(required = false) Long userId,
                                     @RequestBody Goal goal,
                                     HttpSession session) {
        Long targetId = resolveUserId(userId, session);
        if (targetId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User ID required."));
        }

        goal.setUserId(targetId);
        if (goal.getCurrentAmount() == null) goal.setCurrentAmount(0.0);
        if (goal.getStatus() == null) goal.setStatus("active");

        Goal saved = goalRepository.save(goal);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/deposit")
    public ResponseEntity<?> depositToGoal(@PathVariable Long id,
                                           @RequestParam(required = false) Long userId,
                                           @RequestBody Map<String, Object> body,
                                           HttpSession session) {
        Long targetId = resolveUserId(userId, session);
        if (targetId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User ID required."));
        }

        Double amount = Double.valueOf(body.get("amount").toString());
        Optional<Goal> goalOpt = goalRepository.findById(id);

        if (goalOpt.isEmpty() || !goalOpt.get().getUserId().equals(targetId)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Goal not found."));
        }

        Goal goal = goalOpt.get();
        goal.setCurrentAmount(goal.getCurrentAmount() + amount);
        if (goal.getCurrentAmount() >= goal.getTargetAmount()) {
            goal.setStatus("completed");
        }

        Goal updated = goalRepository.save(goal);
        return ResponseEntity.ok(updated);
    }
}
