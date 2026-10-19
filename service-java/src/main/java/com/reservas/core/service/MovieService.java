package com.reservas.core.service;

import com.reservas.core.dto.MovieResponse;
import com.reservas.core.exception.ResourceNotFoundException;
import com.reservas.core.repository.MovieRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class MovieService {

    private final MovieRepository movieRepository;

    public MovieService(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    public List<MovieResponse> findAll() {
        return movieRepository.findAll(Sort.by("title")).stream()
                .map(MovieResponse::from)
                .toList();
    }

    public MovieResponse findById(Long id) {
        return movieRepository.findById(id)
                .map(MovieResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("la película", id));
    }
}
