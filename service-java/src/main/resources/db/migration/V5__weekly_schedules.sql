-- Horarios distintos según el día de la semana, repartidos a lo largo del día

-- 1 = lunes … 7 = domingo (ISO-8601); NULL = todos los días
ALTER TABLE showtime_schedules ADD COLUMN day_of_week SMALLINT CHECK (day_of_week BETWEEN 1 AND 7);

-- La unicidad pasa a ser por sala + día + hora, y solo entre horarios activos
ALTER TABLE showtime_schedules DROP CONSTRAINT uq_schedule_hall_time;
CREATE UNIQUE INDEX uq_schedule_hall_day_time
    ON showtime_schedules (hall, COALESCE(day_of_week, 0), start_time)
    WHERE active;

-- Retira los horarios fijos anteriores y sus funciones futuras que aún no venden boletos
UPDATE showtime_schedules SET active = FALSE;
DELETE FROM showtimes s
WHERE s.schedule_id IS NOT NULL
  AND s.starts_at > now()
  AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.showtime_id = s.id);

-- Sala, precio y tamaño por película; horas de inicio por día.
-- Entre funciones de una misma sala hay al menos la duración de la película + ~20 min.
WITH halls (title, hall, price, seat_rows, seat_columns) AS (
    VALUES ('Avengers: Doomsday', 'Sala 4', 15.00, 10, 16),
           ('Dune: Parte Dos',    'Sala 1', 12.50,  8, 12),
           ('Intensamente 2',     'Sala 2',  9.00,  6, 10),
           ('Oppenheimer',        'Sala 3', 14.00, 10, 14)
),
slots (title, day_of_week, start_time) AS (
    VALUES
    -- Avengers: Doomsday (165 min)
    ('Avengers: Doomsday', 1, '14:00'), ('Avengers: Doomsday', 1, '19:30'),
    ('Avengers: Doomsday', 2, '16:15'), ('Avengers: Doomsday', 2, '21:00'),
    ('Avengers: Doomsday', 3, '12:30'), ('Avengers: Doomsday', 3, '17:45'), ('Avengers: Doomsday', 3, '21:30'),
    ('Avengers: Doomsday', 4, '15:00'), ('Avengers: Doomsday', 4, '20:15'),
    ('Avengers: Doomsday', 5, '13:30'), ('Avengers: Doomsday', 5, '18:00'), ('Avengers: Doomsday', 5, '22:15'),
    ('Avengers: Doomsday', 6, '11:00'), ('Avengers: Doomsday', 6, '15:10'), ('Avengers: Doomsday', 6, '19:20'), ('Avengers: Doomsday', 6, '23:00'),
    ('Avengers: Doomsday', 7, '10:30'), ('Avengers: Doomsday', 7, '14:45'), ('Avengers: Doomsday', 7, '18:50'),
    -- Dune: Parte Dos (166 min)
    ('Dune: Parte Dos', 1, '17:30'),
    ('Dune: Parte Dos', 2, '13:15'), ('Dune: Parte Dos', 2, '19:00'),
    ('Dune: Parte Dos', 3, '15:40'), ('Dune: Parte Dos', 3, '20:45'),
    ('Dune: Parte Dos', 4, '11:30'), ('Dune: Parte Dos', 4, '18:20'),
    ('Dune: Parte Dos', 5, '16:00'), ('Dune: Parte Dos', 5, '21:40'),
    ('Dune: Parte Dos', 6, '12:15'), ('Dune: Parte Dos', 6, '17:00'), ('Dune: Parte Dos', 6, '22:00'),
    ('Dune: Parte Dos', 7, '13:00'), ('Dune: Parte Dos', 7, '19:45'),
    -- Intensamente 2 (96 min)
    ('Intensamente 2', 1, '10:00'), ('Intensamente 2', 1, '15:30'),
    ('Intensamente 2', 2, '11:45'), ('Intensamente 2', 2, '14:20'), ('Intensamente 2', 2, '17:10'),
    ('Intensamente 2', 3, '13:00'), ('Intensamente 2', 3, '16:30'),
    ('Intensamente 2', 4, '10:30'), ('Intensamente 2', 4, '12:50'), ('Intensamente 2', 4, '18:40'),
    ('Intensamente 2', 5, '14:00'), ('Intensamente 2', 5, '19:15'),
    ('Intensamente 2', 6, '09:45'), ('Intensamente 2', 6, '11:50'), ('Intensamente 2', 6, '14:10'), ('Intensamente 2', 6, '16:40'),
    ('Intensamente 2', 7, '10:15'), ('Intensamente 2', 7, '12:40'), ('Intensamente 2', 7, '15:00'), ('Intensamente 2', 7, '17:30'),
    -- Oppenheimer (180 min)
    ('Oppenheimer', 1, '20:00'),
    ('Oppenheimer', 2, '16:00'), ('Oppenheimer', 2, '21:15'),
    ('Oppenheimer', 3, '18:30'),
    ('Oppenheimer', 4, '13:45'), ('Oppenheimer', 4, '20:30'),
    ('Oppenheimer', 5, '17:15'), ('Oppenheimer', 5, '22:30'),
    ('Oppenheimer', 6, '14:30'), ('Oppenheimer', 6, '21:00'),
    ('Oppenheimer', 7, '16:20'), ('Oppenheimer', 7, '20:40')
)
INSERT INTO showtime_schedules (movie_id, hall, day_of_week, start_time, price, seat_rows, seat_columns)
SELECT m.id, h.hall, s.day_of_week, s.start_time::time, h.price, h.seat_rows, h.seat_columns
FROM slots s
JOIN halls h ON h.title = s.title
JOIN movies m ON m.title = s.title;
