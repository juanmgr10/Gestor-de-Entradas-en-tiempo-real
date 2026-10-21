package com.reservas.core.controller;

import com.reservas.core.dto.PurchaseHistoryResponse;
import com.reservas.core.dto.UserResponse;
import com.reservas.core.service.TicketService;
import com.reservas.core.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final TicketService ticketService;

    public UserController(UserService userService, TicketService ticketService) {
        this.userService = userService;
        this.ticketService = ticketService;
    }

    @GetMapping("/{id}")
    public UserResponse findById(@PathVariable Long id) {
        return userService.findById(id);
    }

    @GetMapping("/{id}/purchases")
    public List<PurchaseHistoryResponse> findPurchases(@PathVariable Long id) {
        return ticketService.findPurchaseHistory(id);
    }
}
