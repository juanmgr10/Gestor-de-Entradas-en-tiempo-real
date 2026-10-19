package service

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/reservas/service-go/internal/model"
	"github.com/reservas/service-go/internal/repository"
)

// LockStore abstrae el almacenamiento de bloqueos (implementado sobre Redis).
type LockStore interface {
	Acquire(ctx context.Context, showtimeID int64, seatID string, userID int64, ttl time.Duration) (time.Time, bool, error)
	Release(ctx context.Context, showtimeID int64, seatID string, userID int64) error
	Owners(ctx context.Context, showtimeID int64, seatIDs []string) (map[string]int64, error)
	FindByShowtime(ctx context.Context, showtimeID int64) ([]model.Lock, error)
	MarkSold(ctx context.Context, showtimeID int64, seatIDs []string) error
}

type EventPublisher interface {
	Publish(ctx context.Context, channel string, payload any) error
}

// LockService contiene las reglas de concurrencia de asientos y emite los eventos de dominio.
type LockService struct {
	store     LockStore
	publisher EventPublisher
	ttl       time.Duration
}

func NewLockService(store LockStore, publisher EventPublisher, ttl time.Duration) *LockService {
	return &LockService{store: store, publisher: publisher, ttl: ttl}
}

// Lock bloquea un asiento. Si el usuario ya lo tenía, devuelve el bloqueo vigente sin publicar.
func (s *LockService) Lock(ctx context.Context, req model.LockRequest) (model.Lock, bool, error) {
	expiresAt, created, err := s.store.Acquire(ctx, req.ShowtimeID, req.SeatID, req.UserID, s.ttl)
	if err != nil {
		return model.Lock{}, false, err
	}
	lock := model.Lock{ShowtimeID: req.ShowtimeID, SeatID: req.SeatID, UserID: req.UserID, ExpiresAt: expiresAt}
	if created {
		// El estado en Redis es la fuente de verdad; un fallo al publicar no revierte el bloqueo
		s.publishBestEffort(ctx, model.ChannelSeatLocked, model.SeatLockedEvent(lock))
	}
	return lock, created, nil
}

func (s *LockService) Unlock(ctx context.Context, showtimeID int64, seatID string, userID int64) error {
	if err := s.store.Release(ctx, showtimeID, seatID, userID); err != nil {
		return err
	}
	s.publishBestEffort(ctx, model.ChannelSeatReleased, model.SeatReleasedEvent{
		ShowtimeID: showtimeID, SeatID: seatID, Reason: model.ReleaseReasonCancelled,
	})
	return nil
}

// Verify devuelve los asientos que el usuario NO tiene bloqueados (vacío = puede pagar).
func (s *LockService) Verify(ctx context.Context, req model.VerifyRequest) ([]string, error) {
	owners, err := s.store.Owners(ctx, req.ShowtimeID, req.SeatIDs)
	if err != nil {
		return nil, err
	}
	missing := []string{}
	for _, seat := range req.SeatIDs {
		if owners[seat] != req.UserID {
			missing = append(missing, seat)
		}
	}
	return missing, nil
}

func (s *LockService) ListLocks(ctx context.Context, showtimeID int64) (model.ShowtimeLocks, error) {
	locks, err := s.store.FindByShowtime(ctx, showtimeID)
	if err != nil {
		return model.ShowtimeLocks{}, err
	}
	return model.ShowtimeLocks{ShowtimeID: showtimeID, Locks: locks}, nil
}

// MarkSold confirma la venta (ya registrada por el core transaccional) y publica
// seat.sold y purchase.confirmed. Es idempotente, por lo que el gateway puede reintentarlo.
func (s *LockService) MarkSold(ctx context.Context, purchase model.Purchase) error {
	seatIDs := purchase.SeatIDs()
	if err := s.store.MarkSold(ctx, purchase.ShowtimeID, seatIDs); err != nil {
		return err
	}
	if err := s.publisher.Publish(ctx, model.ChannelSeatSold, model.SeatSoldEvent{
		ShowtimeID: purchase.ShowtimeID, SeatIDs: seatIDs,
	}); err != nil {
		return fmt.Errorf("publicando seat.sold: %w", err)
	}
	if err := s.publisher.Publish(ctx, model.ChannelPurchaseConfirmed, purchase); err != nil {
		return fmt.Errorf("publicando purchase.confirmed: %w", err)
	}
	return nil
}

// OnLockExpired traduce la expiración de una llave de Redis en un evento seat.released.
func (s *LockService) OnLockExpired(ctx context.Context, key string) {
	showtimeID, seatID, ok := repository.ParseLockKey(key)
	if !ok {
		return // no es una llave de bloqueo
	}
	s.publishBestEffort(ctx, model.ChannelSeatReleased, model.SeatReleasedEvent{
		ShowtimeID: showtimeID, SeatID: seatID, Reason: model.ReleaseReasonExpired,
	})
}

func (s *LockService) publishBestEffort(ctx context.Context, channel string, payload any) {
	if err := s.publisher.Publish(ctx, channel, payload); err != nil {
		slog.Error("no se pudo publicar evento", "channel", channel, "error", err)
	}
}
