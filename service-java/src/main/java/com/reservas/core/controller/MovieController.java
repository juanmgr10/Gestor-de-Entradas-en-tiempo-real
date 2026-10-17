package com.reservas.core.controller;

import com.reservas.core.dto.MovieResponse;
import com.reservas.core.dto.ShowtimeResponse;
import com.reservas.core.service.MovieService;
import com.reservas.core.service.ShowtimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;
    private final ShowtimeService showtimeService;

    @GetMapping
    public List<MovieResponse> findAll() {
        return movieService.findAll();
    }

    @GetMapping("/{id}")
    public MovieResponse findById(@PathVariable Long id) {
        return movieService.findById(id);
    }

    @GetMapping("/{id}/showtimes")
    public List<ShowtimeResponse> findShowtimes(@PathVariable Long id) {
        return showtimeService.findByMovie(id);
    }
}
