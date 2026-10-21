package com.reservas.core.service;

import com.reservas.core.dto.PurchaseHistoryResponse;
import com.reservas.core.dto.TicketResponse;
import com.reservas.core.dto.TicketVerificationResponse;
import com.reservas.core.entity.Payment;
import com.reservas.core.entity.Showtime;
import com.reservas.core.entity.Ticket;
import com.reservas.core.exception.ResourceNotFoundException;
import com.reservas.core.repository.TicketRepository;
import com.reservas.core.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Consultas de boletos emitidos: historial del usuario y verificación por código (QR). */
@Service
@Transactional(readOnly = true)
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public TicketService(TicketRepository ticketRepository, UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    /** Compras del usuario, de la más reciente a la más antigua, agrupando boletos por pago. */
    public List<PurchaseHistoryResponse> findPurchaseHistory(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("el usuario", userId);
        }
        Map<Long, List<Ticket>> byPayment = new LinkedHashMap<>();
        for (Ticket ticket : ticketRepository.findHistoryByUserId(userId)) {
            byPayment.computeIfAbsent(ticket.getPayment().getId(), id -> new ArrayList<>()).add(ticket);
        }
        return byPayment.values().stream().map(this::toHistory).toList();
    }

    public TicketVerificationResponse verify(String code) {
        return ticketRepository.findByCodeWithDetails(code)
                .map(TicketVerificationResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("el boleto", code));
    }

    private PurchaseHistoryResponse toHistory(List<Ticket> tickets) {
        Payment payment = tickets.get(0).getPayment();
        Showtime showtime = tickets.get(0).getShowtime();
        return new PurchaseHistoryResponse(
                payment.getId(),
                payment.getAmount(),
                payment.getMethod().name(),
                payment.getCreatedAt(),
                showtime.getMovie().getId(),
                showtime.getMovie().getTitle(),
                showtime.getMovie().getPosterUrl(),
                showtime.getId(),
                showtime.getHall(),
                showtime.getStartsAt(),
                tickets.stream().map(TicketResponse::from).toList());
    }
}
