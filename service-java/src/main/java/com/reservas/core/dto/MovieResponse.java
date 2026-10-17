package com.reservas.core.dto;

import com.reservas.core.entity.Movie;

public record MovieResponse(
        Long id,
        String title,
        String synopsis,
        String genre,
        String rating,
        Integer durationMinutes,
        String posterUrl
) {
    public static MovieResponse from(Movie m) {
        return new MovieResponse(m.getId(), m.getTitle(), m.getSynopsis(), m.getGenre(),
                m.getRating(), m.getDurationMinutes(), m.getPosterUrl());
    }
}
