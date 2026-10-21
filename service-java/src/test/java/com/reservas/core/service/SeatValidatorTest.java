package com.reservas.core.service;

import com.reservas.core.entity.Showtime;
import com.reservas.core.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SeatValidatorTest {

    private final SeatValidator validator = new SeatValidator();
    private Showtime showtime;

    @BeforeEach
    void setUp() {
        showtime = new Showtime();
        showtime.setHall("Sala 1");
        showtime.setSeatRows(8);      // A..H
        showtime.setSeatColumns(12);  // 1..12
    }

    @Test
    void aceptaButacasDentroDeLaSala() {
        assertThatCode(() -> validator.validate(showtime, List.of("A1", "H12", "D7"))).doesNotThrowAnyException();
    }

    @Test
    void rechazaFilaFueraDeLaSala() {
        assertThatThrownBy(() -> validator.validate(showtime, List.of("I1")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("I1");
    }

    @Test
    void rechazaColumnaFueraDeLaSala() {
        assertThatThrownBy(() -> validator.validate(showtime, List.of("A13")))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void rechazaButacasDuplicadas() {
        assertThatThrownBy(() -> validator.validate(showtime, List.of("A1", "A1")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("duplicados");
    }
}
