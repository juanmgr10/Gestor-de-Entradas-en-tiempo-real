package com.reservas.core.service;

import com.reservas.core.dto.MovieResponse;
import com.reservas.core.exception.ResourceNotFoundException;
import com.reservas.core.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MovieService {

    private final MovieRepository movieRepository;

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
