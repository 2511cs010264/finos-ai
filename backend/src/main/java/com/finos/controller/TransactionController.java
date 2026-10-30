package com.finos.controller;

import com.finos.entity.Transaction;
import com.finos.repository.TransactionRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionRepository transactionRepository;

    public TransactionController(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    private Long resolveUserId(Long paramUserId, HttpSession session) {
        Long sessionUserId = (Long) session.getAttribute("userId");
        return sessionUserId != null ? sessionUserId : paramUserId;
    }

    @GetMapping
    public ResponseEntity<?> getTransactions(@RequestParam(required = false) Long userId, HttpSession session) {
        Long targetId = resolveUserId(userId, session);
        if (targetId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User ID required."));
        }

        List<Transaction> transactions = transactionRepository.findByUserIdOrderByDateDescIdDesc(targetId);
        return ResponseEntity.ok(transactions);
    }

    @PostMapping
    public ResponseEntity<?> addTransaction(@RequestParam(required = false) Long userId,
                                            @RequestBody Transaction tx,
                                            HttpSession session) {
        Long targetId = resolveUserId(userId, session);
        if (targetId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User ID required."));
        }

        tx.setUserId(targetId);
        if (tx.getDate() == null) {
            tx.setDate(LocalDate.now());
        }

        Transaction saved = transactionRepository.save(tx);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTransaction(@PathVariable Long id,
                                               @RequestParam(required = false) Long userId,
                                               HttpSession session) {
        Long targetId = resolveUserId(userId, session);
        if (targetId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User ID required."));
        }

        transactionRepository.findById(id).ifPresent(tx -> {
            if (tx.getUserId().equals(targetId)) {
                transactionRepository.delete(tx);
            }
        });

        return ResponseEntity.ok(Map.of("success", true));
    }
}
