-- Horarios fijos de cartelera: a partir de ellos se generan las funciones de cada día

CREATE TABLE showtime_schedules (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    movie_id     BIGINT        NOT NULL REFERENCES movies (id),
    hall         VARCHAR(50)   NOT NULL,
    start_time   TIME          NOT NULL,   -- hora local (APP_TIMEZONE)
    price        NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    seat_rows    INTEGER       NOT NULL CHECK (seat_rows BETWEEN 1 AND 26),
    seat_columns INTEGER       NOT NULL CHECK (seat_columns BETWEEN 1 AND 50),
    active       BOOLEAN       NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_schedule_hall_time UNIQUE (hall, start_time)
);

-- Función generada a partir de un horario (NULL en las funciones antiguas)
ALTER TABLE showtimes ADD COLUMN schedule_id BIGINT REFERENCES showtime_schedules (id);
-- Una sala no puede tener dos funciones a la misma hora; también hace idempotente la generación
ALTER TABLE showtimes ADD CONSTRAINT uq_showtime_hall_start UNIQUE (hall, starts_at);
CREATE INDEX idx_showtimes_starts_at ON showtimes (starts_at);

-- Nuevo estreno
INSERT INTO movies (title, synopsis, genre, rating, duration_minutes, poster_url) VALUES
 ('Avengers: Doomsday',
  'Los Vengadores y nuevos aliados de todo el multiverso se unen para enfrentar a Doctor Doom, la mayor amenaza que han conocido.',
  'Acción', 'PG-13', 165,
  'https://image.tmdb.org/t/p/w500/7bQczUMnjz8iwxNP9YrmLkfI8od.jpg');

INSERT INTO showtime_schedules (movie_id, hall, start_time, price, seat_rows, seat_columns)
SELECT m.id, s.hall, s.start_time::time, s.price, s.seat_rows, s.seat_columns
FROM (VALUES
    ('Avengers: Doomsday', 'Sala 4', '17:00', 15.00, 10, 16),
    ('Avengers: Doomsday', 'Sala 4', '20:30', 15.00, 10, 16),
    ('Dune: Parte Dos',    'Sala 1', '15:30', 12.50,  8, 12),
    ('Dune: Parte Dos',    'Sala 1', '21:00', 12.50,  8, 12),
    ('Intensamente 2',     'Sala 2', '13:00',  9.00,  6, 10),
    ('Intensamente 2',     'Sala 2', '16:30',  9.00,  6, 10),
    ('Oppenheimer',        'Sala 3', '19:30', 14.00, 10, 14)
) AS s (title, hall, start_time, price, seat_rows, seat_columns)
JOIN movies m ON m.title = s.title;
