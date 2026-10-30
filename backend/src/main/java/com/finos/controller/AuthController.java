package com.finos.controller;

import com.finos.entity.Profile;
import com.finos.entity.User;
import com.finos.repository.ProfileRepository;
import com.finos.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;

    public AuthController(UserRepository userRepository, ProfileRepository profileRepository) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request, HttpSession session) {
        String email = request.get("email");
        String password = request.get("password");
        String fullName = request.getOrDefault("fullName", "User");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required."));
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User with this email already exists."));
        }

        User user = new User(email, password, fullName);
        user = userRepository.save(user);

        // Auto-create matching Profile row
        Profile profile = new Profile(user.getId(), fullName);
        profileRepository.save(profile);

        session.setAttribute("userId", user.getId());

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", user.getId());
        resp.put("email", user.getEmail());
        resp.put("fullName", user.getFullName());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request, HttpSession session) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required."));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty() || !userOpt.get().getPassword().equals(password)) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password."));
        }

        User user = userOpt.get();
        session.setAttribute("userId", user.getId());

        // Ensure profile exists
        if (!profileRepository.existsById(user.getId())) {
            profileRepository.save(new Profile(user.getId(), user.getFullName()));
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", user.getId());
        resp.put("email", user.getEmail());
        resp.put("fullName", user.getFullName());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/session")
    public ResponseEntity<?> getSession(@RequestParam(required = false) Long userId, HttpSession session) {
        Long currentUserId = (Long) session.getAttribute("userId");
        if (currentUserId == null && userId != null) {
            currentUserId = userId; // fallback for non-cookie API calls
        }

        if (currentUserId == null) {
            return ResponseEntity.ok(Map.of("authenticated", false));
        }

        Optional<User> userOpt = userRepository.findById(currentUserId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("authenticated", false));
        }

        User user = userOpt.get();
        Map<String, Object> resp = new HashMap<>();
        resp.put("authenticated", true);
        resp.put("userId", user.getId());
        resp.put("email", user.getEmail());
        resp.put("fullName", user.getFullName());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("message", "Logged out successfully."));
    }
}
