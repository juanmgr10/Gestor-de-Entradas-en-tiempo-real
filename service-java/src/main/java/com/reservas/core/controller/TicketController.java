package com.reservas.core.controller;

import com.reservas.core.dto.TicketVerificationResponse;
import com.reservas.core.service.TicketService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping("/{code}")
    public TicketVerificationResponse verify(@PathVariable String code) {
        return ticketService.verify(code);
    }
}
