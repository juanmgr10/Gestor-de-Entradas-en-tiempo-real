package com.reservas.core.service;

import com.reservas.core.dto.PurchaseRequest;
import com.reservas.core.dto.PurchaseResponse;
import com.reservas.core.entity.Movie;
import com.reservas.core.entity.Payment;
import com.reservas.core.entity.Showtime;
import com.reservas.core.entity.User;
import com.reservas.core.exception.BusinessException;
import com.reservas.core.exception.SeatAlreadySoldException;
import com.reservas.core.repository.TicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PurchaseServiceTest {

    @Mock UserService userService;
    @Mock ShowtimeService showtimeService;
    @Mock PaymentService paymentService;
    @Mock TicketRepository ticketRepository;

    private PurchaseService purchaseService;
    private User user;
    private Showtime showtime;

    @BeforeEach
    void setUp() {
        purchaseService = new PurchaseService(userService, showtimeService, paymentService, new SeatValidator(), ticketRepository);

        user = new User();
        user.setId(7L);

        Movie movie = new Movie();
        movie.setId(1L);
        movie.setTitle("Dune: Parte Dos");

        showtime = new Showtime();
        showtime.setId(10L);
        showtime.setMovie(movie);
        showtime.setHall("Sala 1");
        showtime.setStartsAt(OffsetDateTime.now().plusDays(1));
        showtime.setPrice(new BigDecimal("12.50"));
        showtime.setSeatRows(8);
        showtime.setSeatColumns(12);

        when(userService.getEntity(7L)).thenReturn(user);
        when(showtimeService.getEntity(10L)).thenReturn(showtime);
    }

    private PurchaseRequest request(String... seats) {
        return new PurchaseRequest(7L, 10L, List.of(seats), Payment.Method.CARD);
    }

    @Test
    void compraValidaCobraPrecioPorButacaYEmiteUnBoletoPorAsiento() {
        Payment payment = new Payment();
        payment.setId(99L);
        when(ticketRepository.findSoldAmong(10L, List.of("A1", "A2"))).thenReturn(List.of());
        when(paymentService.charge(user, new BigDecimal("25.00"), Payment.Method.CARD)).thenReturn(payment);
        when(ticketRepository.saveAllAndFlush(anyList())).thenAnswer(inv -> inv.getArgument(0));

        PurchaseResponse response = purchaseService.purchase(request("A1", "A2"));

        assertThat(response.amount()).isEqualByComparingTo("25.00");
        assertThat(response.paymentId()).isEqualTo(99L);
        assertThat(response.movieTitle()).isEqualTo("Dune: Parte Dos");
        assertThat(response.tickets()).extracting("seatId").containsExactly("A1", "A2");
    }

    @Test
    void asientoYaVendidoNoCobra() {
        when(ticketRepository.findSoldAmong(10L, List.of("A1"))).thenReturn(List.of("A1"));

        assertThatThrownBy(() -> purchaseService.purchase(request("A1")))
                .isInstanceOf(SeatAlreadySoldException.class);
        verify(paymentService, never()).charge(any(), any(), any());
    }

    @Test
    void funcionQueYaComenzoNoAdmiteCompras() {
        showtime.setStartsAt(OffsetDateTime.now().minusMinutes(1));

        assertThatThrownBy(() -> purchaseService.purchase(request("A1")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ya comenzó");
        verifyNoInteractions(paymentService);
    }
}
