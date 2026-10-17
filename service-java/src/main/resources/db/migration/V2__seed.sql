-- Datos de demostración

INSERT INTO movies (title, synopsis, genre, rating, duration_minutes, poster_url) VALUES
 ('Dune: Parte Dos', 'Paul Atreides se une a los Fremen en su guerra contra los Harkonnen.', 'Ciencia ficción', 'PG-13', 166, 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg'),
 ('Intensamente 2', 'Riley entra a la adolescencia y llegan nuevas emociones.', 'Animación', 'ATP', 96, 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg'),
 ('Oppenheimer', 'La historia del físico que dirigió el Proyecto Manhattan.', 'Drama', 'R', 180, 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg');

INSERT INTO showtimes (movie_id, hall, starts_at, price, seat_rows, seat_columns) VALUES
 (1, 'Sala 1', date_trunc('hour', now()) + INTERVAL '1 day 18 hours', 12.50, 8, 12),
 (1, 'Sala 1', date_trunc('hour', now()) + INTERVAL '1 day 21 hours', 12.50, 8, 12),
 (2, 'Sala 2', date_trunc('hour', now()) + INTERVAL '1 day 16 hours',  9.00, 6, 10),
 (3, 'Sala 3', date_trunc('hour', now()) + INTERVAL '2 days 20 hours', 14.00, 10, 14);
