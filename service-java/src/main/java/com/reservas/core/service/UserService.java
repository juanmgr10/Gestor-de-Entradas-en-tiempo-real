package com.reservas.core.service;

import com.reservas.core.dto.UserRequest;
import com.reservas.core.dto.UserResponse;
import com.reservas.core.entity.User;
import com.reservas.core.exception.ResourceNotFoundException;
import com.reservas.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    /** Registra al usuario o devuelve el existente con el mismo email (idempotente). */
    @Transactional
    public UserResponse register(UserRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseGet(() -> {
                    User u = new User();
                    u.setName(request.name().trim());
                    u.setEmail(request.email().trim().toLowerCase());
                    return userRepository.save(u);
                });
        return UserResponse.from(user);
    }

    public UserResponse findById(Long id) {
        return UserResponse.from(getEntity(id));
    }

    User getEntity(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("el usuario", id));
    }
}
