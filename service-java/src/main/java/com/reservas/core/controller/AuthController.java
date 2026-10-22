package com.reservas.core.controller;

import com.reservas.core.dto.LoginRequest;
import com.reservas.core.dto.RegisterRequest;
import com.reservas.core.dto.ResendCodeRequest;
import com.reservas.core.dto.UserResponse;
import com.reservas.core.dto.VerifyEmailRequest;
import com.reservas.core.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/verify-email")
    public UserResponse verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return authService.verifyEmail(request.username(), request.code());
    }

    @PostMapping("/resend-code")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resendCode(@Valid @RequestBody ResendCodeRequest request) {
        authService.resendCode(request.username());
    }
}
