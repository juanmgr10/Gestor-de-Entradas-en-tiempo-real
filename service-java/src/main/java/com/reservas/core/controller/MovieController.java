package com.reservas.core.controller;

import com.reservas.core.dto.MovieResponse;
import com.reservas.core.dto.ShowtimeResponse;
import com.reservas.core.service.MovieService;
import com.reservas.core.service.ShowtimeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/movies")
public class MovieController {

    private final MovieService movieService;
    private final ShowtimeService showtimeService;

    public MovieController(MovieService movieService, ShowtimeService showtimeService) {
        this.movieService = movieService;
        this.showtimeService = showtimeService;
    }

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
