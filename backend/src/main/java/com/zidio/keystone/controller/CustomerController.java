package com.zidio.keystone.controller;

import com.zidio.keystone.dto.CustomerDtos;
import com.zidio.keystone.dto.PageResponse;
import com.zidio.keystone.dto.SiteDtos;
import com.zidio.keystone.security.UserPrincipal;
import com.zidio.keystone.service.CustomerService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Customers & Sites", description = "Customer organisations and their sites")
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping("/customers")
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public ResponseEntity<PageResponse<CustomerDtos.CustomerResponse>> list(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = customerService.list(search, PageRequest.of(page, size, Sort.by("name")));
        return ResponseEntity.ok(PageResponse.from(result));
    }

    @GetMapping("/customers/{id}")
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER','CUSTOMER')")
    public ResponseEntity<CustomerDtos.CustomerResponse> get(@PathVariable Long id,
                                                              @AuthenticationPrincipal UserPrincipal principal) {
        customerService.assertCanAccessCustomer(id, principal);
        return ResponseEntity.ok(customerService.get(id));
    }

    @PostMapping("/customers")
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public ResponseEntity<CustomerDtos.CustomerResponse> create(@Valid @RequestBody CustomerDtos.CustomerRequest request) {
        return ResponseEntity.status(201).body(customerService.create(request));
    }

    @PutMapping("/customers/{id}")
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public ResponseEntity<CustomerDtos.CustomerResponse> update(@PathVariable Long id,
                                                                 @Valid @RequestBody CustomerDtos.CustomerRequest request) {
        return ResponseEntity.ok(customerService.update(id, request));
    }

    @GetMapping("/customers/{id}/sites")
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER','CUSTOMER')")
    public ResponseEntity<List<SiteDtos.SiteResponse>> sitesForCustomer(@PathVariable Long id,
                                                                         @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(customerService.listSites(id, principal));
    }

    @PostMapping("/sites")
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public ResponseEntity<SiteDtos.SiteResponse> createSite(@Valid @RequestBody SiteDtos.SiteRequest request) {
        return ResponseEntity.status(201).body(customerService.createSite(request));
    }

    @PutMapping("/sites/{id}")
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public ResponseEntity<SiteDtos.SiteResponse> updateSite(@PathVariable Long id,
                                                             @Valid @RequestBody SiteDtos.SiteRequest request) {
        return ResponseEntity.ok(customerService.updateSite(id, request));
    }
}
