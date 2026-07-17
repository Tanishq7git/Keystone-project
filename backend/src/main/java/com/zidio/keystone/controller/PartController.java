package com.zidio.keystone.controller;

import com.zidio.keystone.dto.PartDtos;
import com.zidio.keystone.service.PartService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parts")
@RequiredArgsConstructor
@Tag(name = "Parts", description = "Inventory of spare parts used on jobs")
public class PartController {

    private final PartService partService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PartDtos.PartResponse>> list() {
        return ResponseEntity.ok(partService.list());
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<PartDtos.PartResponse> create(@Valid @RequestBody PartDtos.PartRequest request) {
        return ResponseEntity.status(201).body(partService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<PartDtos.PartResponse> update(@PathVariable Long id, @Valid @RequestBody PartDtos.PartRequest request) {
        return ResponseEntity.ok(partService.update(id, request));
    }
}
