package com.finos.controller;

import com.finos.entity.Profile;
import com.finos.repository.ProfileRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileRepository profileRepository;

    public ProfileController(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    private Long resolveUserId(Long paramUserId, HttpSession session) {
        Long sessionUserId = (Long) session.getAttribute("userId");
        return sessionUserId != null ? sessionUserId : paramUserId;
    }

    @GetMapping
    public ResponseEntity<?> getProfile(@RequestParam(required = false) Long userId, HttpSession session) {
        Long targetId = resolveUserId(userId, session);
        if (targetId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User ID required."));
        }

        Profile profile = profileRepository.findById(targetId)
                .orElseGet(() -> profileRepository.save(new Profile(targetId, "User")));

        return ResponseEntity.ok(profile);
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestParam(required = false) Long userId,
                                           @RequestBody Profile updates,
                                           HttpSession session) {
        Long targetId = resolveUserId(userId, session);
        if (targetId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User ID required."));
        }

        Profile profile = profileRepository.findById(targetId)
                .orElse(new Profile(targetId, "User"));

        if (updates.getFullName() != null) profile.setFullName(updates.getFullName());
        if (updates.getCity() != null) profile.setCity(updates.getCity());
        if (updates.getOccupation() != null) profile.setOccupation(updates.getOccupation());
        if (updates.getMonthlyIncome() != null) profile.setMonthlyIncome(updates.getMonthlyIncome());
        if (updates.getMonthlyRent() != null) profile.setMonthlyRent(updates.getMonthlyRent());
        if (updates.getMonthlyEmi() != null) profile.setMonthlyEmi(updates.getMonthlyEmi());
        if (updates.getFamilyMembers() != null) profile.setFamilyMembers(updates.getFamilyMembers());
        if (updates.getMonthlySavings() != null) profile.setMonthlySavings(updates.getMonthlySavings());
        if (updates.getFinancialGoal() != null) profile.setFinancialGoal(updates.getFinancialGoal());
        if (updates.getPreferredLanguage() != null) profile.setPreferredLanguage(updates.getPreferredLanguage());
        if (updates.getCurrency() != null) profile.setCurrency(updates.getCurrency());
        if (updates.getOnboardingCompleted() != null) profile.setOnboardingCompleted(updates.getOnboardingCompleted());

        Profile saved = profileRepository.save(profile);
        return ResponseEntity.ok(saved);
    }
}
