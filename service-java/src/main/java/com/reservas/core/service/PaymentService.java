package com.reservas.core.service;

import com.reservas.core.entity.Payment;
import com.reservas.core.entity.User;
import com.reservas.core.exception.PaymentRejectedException;
import com.reservas.core.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/** Pasarela de pago simulada. Aquí se integraría un proveedor real. */
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public Payment charge(User user, BigDecimal amount, Payment.Method method) {
        if (amount.signum() <= 0) {
            throw new PaymentRejectedException("Monto inválido");
        }
        Payment payment = new Payment();
        payment.setUser(user);
        payment.setAmount(amount);
        payment.setMethod(method);
        payment.setStatus(Payment.Status.APPROVED);
        return paymentRepository.save(payment);
    }
}
