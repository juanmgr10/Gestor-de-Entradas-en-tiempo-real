package com.reservas.core.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/** Horario fijo de una película en una sala; genera una función por día. */
@Entity
@Table(name = "showtime_schedules")
public class ShowtimeSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @Column(nullable = false, length = 50)
    private String hall;

    // 1 = lunes … 7 = domingo; null = todos los días
    @Column(name = "day_of_week")
    private Short dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "seat_rows", nullable = false)
    private Integer seatRows;

    @Column(name = "seat_columns", nullable = false)
    private Integer seatColumns;

    @Column(nullable = false)
    private boolean active = true;

    public Long getId() {
        return id;
    }

    public Movie getMovie() {
        return movie;
    }

    public String getHall() {
        return hall;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public Integer getSeatRows() {
        return seatRows;
    }

    public Integer getSeatColumns() {
        return seatColumns;
    }

    public boolean isActive() {
        return active;
    }

    public Short getDayOfWeek() {
        return dayOfWeek;
    }

    /** Indica si el horario tiene función en la fecha dada. */
    public boolean appliesTo(LocalDate date) {
        return dayOfWeek == null || dayOfWeek == date.getDayOfWeek().getValue();
    }
}
