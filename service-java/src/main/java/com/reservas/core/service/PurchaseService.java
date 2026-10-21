package com.reservas.core.service;

import com.reservas.core.dto.PurchaseRequest;
import com.reservas.core.dto.PurchaseResponse;
import com.reservas.core.dto.TicketResponse;
import com.reservas.core.entity.Payment;
import com.reservas.core.entity.Showtime;
import com.reservas.core.entity.Ticket;
import com.reservas.core.entity.User;
import com.reservas.core.exception.BusinessException;
import com.reservas.core.exception.SeatAlreadySoldException;
import com.reservas.core.repository.TicketRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Confirma una compra: valida asientos, cobra y emite boletos en una sola transacción.
 * La verificación del bloqueo temporal (Redis) la orquesta el API Gateway antes de llamar aquí.
 */
@Service
public class PurchaseService {

    private static final Logger log = LoggerFactory.getLogger(PurchaseService.class);

    private final UserService userService;
    private final ShowtimeService showtimeService;
    private final PaymentService paymentService;
    private final SeatValidator seatValidator;
    private final TicketRepository ticketRepository;

    public PurchaseService(UserService userService, ShowtimeService showtimeService, PaymentService paymentService, SeatValidator seatValidator, TicketRepository ticketRepository) {
        this.userService = userService;
        this.showtimeService = showtimeService;
        this.paymentService = paymentService;
        this.seatValidator = seatValidator;
        this.ticketRepository = ticketRepository;
    }

    @Transactional
    public PurchaseResponse purchase(PurchaseRequest request) {
        User user = userService.getEntity(request.userId());
        Showtime showtime = showtimeService.getEntity(request.showtimeId());
        List<String> seatIds = request.seatIds();

        if (!showtime.getStartsAt().isAfter(OffsetDateTime.now())) {
            throw new BusinessException("La función ya comenzó; no se pueden comprar boletos");
        }
        seatValidator.validate(showtime, seatIds);

        List<String> alreadySold = ticketRepository.findSoldAmong(showtime.getId(), seatIds);
        if (!alreadySold.isEmpty()) {
            throw new SeatAlreadySoldException(alreadySold);
        }

        BigDecimal amount = showtime.getPrice().multiply(BigDecimal.valueOf(seatIds.size()));
        Payment payment = paymentService.charge(user, amount, request.paymentMethod());

        List<Ticket> tickets = seatIds.stream()
                .map(seatId -> buildTicket(showtime, user, payment, seatId))
                .toList();
        // flush inmediato: si otra transacción vendió el asiento, la restricción UNIQUE falla aquí
        List<Ticket> saved = ticketRepository.saveAllAndFlush(tickets);

        log.info("Compra confirmada: pago={} función={} asientos={}", payment.getId(), showtime.getId(), seatIds);

        return new PurchaseResponse(
                payment.getId(),
                user.getId(),
                showtime.getId(),
                showtime.getMovie().getId(),
                showtime.getMovie().getTitle(),
                amount,
                saved.stream().map(TicketResponse::from).toList(),
                payment.getCreatedAt());
    }

    private Ticket buildTicket(Showtime showtime, User user, Payment payment, String seatId) {
        Ticket ticket = new Ticket();
        ticket.setShowtime(showtime);
        ticket.setUser(user);
        ticket.setPayment(payment);
        ticket.setSeatId(seatId);
        return ticket;
    }
}
