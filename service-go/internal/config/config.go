package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config agrupa la configuración del servicio, leída de variables de entorno.
type Config struct {
	Port          string
	RedisAddr     string
	RedisPassword string
	RedisDB       int
	LockTTL       time.Duration
}

func Load() (*Config, error) {
	db, err := strconv.Atoi(getEnv("REDIS_DB", "0"))
	if err != nil {
		return nil, fmt.Errorf("REDIS_DB inválido: %w", err)
	}
	ttl, err := strconv.Atoi(getEnv("LOCK_TTL_SECONDS", "300"))
	if err != nil || ttl <= 0 {
		return nil, fmt.Errorf("LOCK_TTL_SECONDS inválido")
	}
	return &Config{
		Port:          getEnv("PORT", "8081"),
		RedisAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword: os.Getenv("REDIS_PASSWORD"),
		RedisDB:       db,
		LockTTL:       time.Duration(ttl) * time.Second,
	}, nil
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}
