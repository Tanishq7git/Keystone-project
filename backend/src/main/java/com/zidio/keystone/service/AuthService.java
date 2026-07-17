package com.zidio.keystone.service;

import com.zidio.keystone.domain.User;
import com.zidio.keystone.dto.AuthDtos;
import com.zidio.keystone.exception.ResourceNotFoundException;
import com.zidio.keystone.repository.UserRepository;
import com.zidio.keystone.security.JwtService;
import com.zidio.keystone.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthDtos.LoginResponse login(AuthDtos.LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (org.springframework.security.core.AuthenticationException ex) {
            throw new BadCredentialsException("Invalid email or password.");
        }

        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        Long customerId = user.getCustomer() != null ? user.getCustomer().getId() : null;

        return new AuthDtos.LoginResponse(
                token, user.getId(), user.getName(), user.getEmail(),
                user.getRole().name(), customerId, jwtService.getExpirationMs());
    }

    public AuthDtos.CurrentUserResponse currentUser(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        Long customerId = user.getCustomer() != null ? user.getCustomer().getId() : null;
        String customerName = user.getCustomer() != null ? user.getCustomer().getName() : null;
        return new AuthDtos.CurrentUserResponse(
                user.getId(), user.getName(), user.getEmail(), user.getRole().name(), customerId, customerName);
    }
}
