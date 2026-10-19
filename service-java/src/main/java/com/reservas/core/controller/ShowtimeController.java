package com.reservas.core.controller;

import com.reservas.core.dto.ShowtimeResponse;
import com.reservas.core.dto.SoldSeatsResponse;
import com.reservas.core.service.ShowtimeService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/showtimes")
public class ShowtimeController {

    private final ShowtimeService showtimeService;

    public ShowtimeController(ShowtimeService showtimeService) {
        this.showtimeService = showtimeService;
    }

    @GetMapping("/{id}")
    public ShowtimeResponse findById(@PathVariable Long id) {
        return showtimeService.findById(id);
    }

    @GetMapping("/{id}/sold-seats")
    public SoldSeatsResponse findSoldSeats(@PathVariable Long id) {
        return showtimeService.findSoldSeats(id);
    }
}
