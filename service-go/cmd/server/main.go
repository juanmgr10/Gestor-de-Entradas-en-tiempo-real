package main

import (
	"context"
	"errors"
	"flag"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/reservas/service-go/internal/config"
	"github.com/reservas/service-go/internal/events"
	"github.com/reservas/service-go/internal/handler"
	"github.com/reservas/service-go/internal/repository"
	"github.com/reservas/service-go/internal/service"
)

func main() {
	// La imagen distroless no tiene curl/wget: el mismo binario hace de healthcheck
	healthcheck := flag.Bool("healthcheck", false, "consulta /health y termina")
	flag.Parse()

	cfg, err := config.Load()
	if err != nil {
		slog.Error("configuración inválida", "error", err)
		os.Exit(1)
	}
	if *healthcheck {
		os.Exit(runHealthcheck(cfg.Port))
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})
	defer rdb.Close()
	if err := rdb.Ping(ctx).Err(); err != nil {
		slog.Error("no se pudo conectar a Redis", "addr", cfg.RedisAddr, "error", err)
		os.Exit(1)
	}

	// Composición de capas: repository -> service -> handler
	repo := repository.NewLockRepository(rdb)
	lockService := service.NewLockService(repo, events.NewPublisher(rdb), cfg.LockTTL)
	router := handler.NewRouter(handler.NewLockHandler(lockService), repo)

	go events.ListenExpirations(ctx, rdb, cfg.RedisDB, lockService.OnLockExpired)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}
	go func() {
		slog.Info("service-go escuchando", "port", cfg.Port, "lockTTL", cfg.LockTTL)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("error del servidor HTTP", "error", err)
			stop()
		}
	}()

	<-ctx.Done()
	slog.Info("apagando service-go")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
}

func runHealthcheck(port string) int {
	client := http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get("http://localhost:" + port + "/health")
	if err != nil || resp.StatusCode != http.StatusOK {
		return 1
	}
	return 0
}
