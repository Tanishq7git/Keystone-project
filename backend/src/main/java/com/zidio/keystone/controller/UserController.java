package com.zidio.keystone.controller;

import com.zidio.keystone.dto.UserDtos;
import com.zidio.keystone.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Platform users and technician roster")
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<UserDtos.UserResponse>> list() {
        return ResponseEntity.ok(userService.list());
    }

    @GetMapping("/technicians")
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public ResponseEntity<List<UserDtos.UserResponse>> technicians() {
        return ResponseEntity.ok(userService.technicians());
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<UserDtos.UserResponse> create(@Valid @RequestBody UserDtos.UserCreateRequest request) {
        return ResponseEntity.status(201).body(userService.create(request));
    }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<UserDtos.UserResponse> setActive(@PathVariable Long id, @RequestParam boolean active) {
        return ResponseEntity.ok(userService.setActive(id, active));
    }
}
