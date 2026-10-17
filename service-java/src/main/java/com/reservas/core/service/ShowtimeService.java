package com.reservas.core.service;

import com.reservas.core.dto.ShowtimeResponse;
import com.reservas.core.dto.SoldSeatsResponse;
import com.reservas.core.entity.Showtime;
import com.reservas.core.exception.ResourceNotFoundException;
import com.reservas.core.repository.MovieRepository;
import com.reservas.core.repository.ShowtimeRepository;
import com.reservas.core.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShowtimeService {

    private final ShowtimeRepository showtimeRepository;
    private final MovieRepository movieRepository;
    private final TicketRepository ticketRepository;

    public List<ShowtimeResponse> findByMovie(Long movieId) {
        if (!movieRepository.existsById(movieId)) {
            throw new ResourceNotFoundException("la película", movieId);
        }
        return showtimeRepository.findByMovieIdWithMovie(movieId).stream()
                .map(ShowtimeResponse::from)
                .toList();
    }

    public ShowtimeResponse findById(Long id) {
        return ShowtimeResponse.from(getEntity(id));
    }

    public SoldSeatsResponse findSoldSeats(Long id) {
        if (!showtimeRepository.existsById(id)) {
            throw new ResourceNotFoundException("la función", id);
        }
        return new SoldSeatsResponse(id, ticketRepository.findSeatIdsByShowtimeId(id));
    }

    Showtime getEntity(Long id) {
        return showtimeRepository.findByIdWithMovie(id)
                .orElseThrow(() -> new ResourceNotFoundException("la función", id));
    }
}
