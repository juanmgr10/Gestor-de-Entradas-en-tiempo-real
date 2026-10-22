package com.reservas.core.repository;

import com.reservas.core.entity.EmailVerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, Long> {
}
