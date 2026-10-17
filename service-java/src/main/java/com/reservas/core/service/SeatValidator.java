package com.reservas.core.service;

import com.reservas.core.entity.Showtime;
import com.reservas.core.exception.BusinessException;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;

/** Valida que los asientos (formato "A1": fila letra + columna número) existan en la sala. */
@Component
public class SeatValidator {

    public void validate(Showtime showtime, List<String> seatIds) {
        if (new HashSet<>(seatIds).size() != seatIds.size()) {
            throw new BusinessException("La lista de asientos contiene duplicados");
        }
        for (String seatId : seatIds) {
            int row = seatId.charAt(0) - 'A' + 1;
            int column = Integer.parseInt(seatId.substring(1));
            if (row > showtime.getSeatRows() || column > showtime.getSeatColumns()) {
                throw new BusinessException("El asiento " + seatId + " no existe en " + showtime.getHall());
            }
        }
    }
}
