package com.zidio.keystone.service;

import com.zidio.keystone.domain.Customer;
import com.zidio.keystone.domain.Role;
import com.zidio.keystone.domain.User;
import com.zidio.keystone.dto.UserDtos;
import com.zidio.keystone.exception.DuplicateResourceException;
import com.zidio.keystone.exception.ResourceNotFoundException;
import com.zidio.keystone.repository.CustomerRepository;
import com.zidio.keystone.repository.UserRepository;
import com.zidio.keystone.repository.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final WorkOrderRepository workOrderRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserDtos.UserResponse> list() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<UserDtos.UserResponse> technicians() {
        return userRepository.findByRole(Role.TECHNICIAN).stream().map(this::toResponse).toList();
    }

    @Transactional
    public UserDtos.UserResponse create(UserDtos.UserCreateRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new DuplicateResourceException("A user with email " + request.email() + " already exists.");
        }
        Role role = Role.valueOf(request.role().toUpperCase());

        Customer customer = null;
        if (request.customerId() != null) {
            customer = customerRepository.findById(request.customerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer " + request.customerId() + " not found."));
        }
        if (role == Role.CUSTOMER && customer == null) {
            throw new IllegalArgumentException("A CUSTOMER user must be linked to a customer organisation.");
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(role)
                .customer(customer)
                .active(true)
                .build();

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserDtos.UserResponse setActive(Long id, boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User " + id + " not found."));
        user.setActive(active);
        return toResponse(userRepository.save(user));
    }

    private UserDtos.UserResponse toResponse(User u) {
        long openJobs = u.getRole() == Role.TECHNICIAN ? workOrderRepository.countByAssignedToId(u.getId()) : 0;
        Long customerId = u.getCustomer() != null ? u.getCustomer().getId() : null;
        String customerName = u.getCustomer() != null ? u.getCustomer().getName() : null;
        return new UserDtos.UserResponse(u.getId(), u.getName(), u.getEmail(), u.getRole().name(),
                customerId, customerName, u.isActive(), openJobs, u.getCreatedAt());
    }
}
