package com.finos.controller;

import com.finos.entity.Notification;
import com.finos.repository.NotificationRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    private Long resolveUserId(Long paramUserId, HttpSession session) {
        Long sessionUserId = (Long) session.getAttribute("userId");
        return sessionUserId != null ? sessionUserId : paramUserId;
    }

    @GetMapping
    public ResponseEntity<?> getNotifications(@RequestParam(required = false) Long userId, HttpSession session) {
        Long targetId = resolveUserId(userId, session);
        if (targetId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User ID required."));
        }

        List<Notification> notes = notificationRepository.findByUserIdOrderByCreatedAtDesc(targetId);
        return ResponseEntity.ok(notes);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id,
                                       @RequestParam(required = false) Long userId,
                                       HttpSession session) {
        Long targetId = resolveUserId(userId, session);
        if (targetId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User ID required."));
        }

        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUserId().equals(targetId)) {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        });

        return ResponseEntity.ok(Map.of("success", true));
    }
}
