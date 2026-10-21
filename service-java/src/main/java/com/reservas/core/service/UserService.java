package com.reservas.core.service;

import com.reservas.core.dto.UserResponse;
import com.reservas.core.entity.User;
import com.reservas.core.exception.ResourceNotFoundException;
import com.reservas.core.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponse findById(Long id) {
        return UserResponse.from(getEntity(id));
    }

    User getEntity(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("el usuario", id));
    }
}
