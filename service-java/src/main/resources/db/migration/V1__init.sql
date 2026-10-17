-- Esquema transaccional del core

CREATE TABLE movies (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title            VARCHAR(150) NOT NULL,
    synopsis         TEXT,
    genre            VARCHAR(50)  NOT NULL,
    rating           VARCHAR(10)  NOT NULL,
    duration_minutes INTEGER      NOT NULL CHECK (duration_minutes > 0),
    poster_url       VARCHAR(500)
);

CREATE TABLE showtimes (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    movie_id     BIGINT        NOT NULL REFERENCES movies (id),
    hall         VARCHAR(50)   NOT NULL,
    starts_at    TIMESTAMPTZ   NOT NULL,
    price        NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    seat_rows    INTEGER       NOT NULL CHECK (seat_rows BETWEEN 1 AND 26),
    seat_columns INTEGER       NOT NULL CHECK (seat_columns BETWEEN 1 AND 50)
);
CREATE INDEX idx_showtimes_movie ON showtimes (movie_id);

CREATE TABLE users (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE payments (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT        NOT NULL REFERENCES users (id),
    amount     NUMERIC(10,2) NOT NULL,
    method     VARCHAR(20)   NOT NULL,
    status     VARCHAR(20)   NOT NULL,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE tickets (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        VARCHAR(36) NOT NULL UNIQUE,
    showtime_id BIGINT      NOT NULL REFERENCES showtimes (id),
    user_id     BIGINT      NOT NULL REFERENCES users (id),
    payment_id  BIGINT      NOT NULL REFERENCES payments (id),
    seat_id     VARCHAR(5)  NOT NULL,
    issued_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Última defensa contra doble venta, aunque falle el bloqueo en Redis
    CONSTRAINT uq_ticket_showtime_seat UNIQUE (showtime_id, seat_id)
);
