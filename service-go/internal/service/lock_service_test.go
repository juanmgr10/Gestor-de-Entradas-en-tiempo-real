package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/reservas/service-go/internal/model"
)

// fakeStore simula Redis en memoria.
type fakeStore struct {
	acquireCreated bool
	acquireErr     error
	owners         map[string]int64
	soldSeats      []string
	marked         bool
}

func (f *fakeStore) Acquire(context.Context, int64, string, int64, time.Duration) (time.Time, bool, error) {
	return time.Now().Add(5 * time.Minute), f.acquireCreated, f.acquireErr
}
func (f *fakeStore) Release(context.Context, int64, string, int64) error { return nil }
func (f *fakeStore) Owners(_ context.Context, _ int64, seats []string) (map[string]int64, error) {
	return f.owners, nil
}
func (f *fakeStore) FindByShowtime(context.Context, int64) ([]model.Lock, error) { return nil, nil }
func (f *fakeStore) MarkSold(_ context.Context, _ int64, seats []string) error {
	f.marked, f.soldSeats = true, seats
	return nil
}

// fakePublisher registra los canales publicados.
type fakePublisher struct {
	channels []string
	failOn   string
}

func (f *fakePublisher) Publish(_ context.Context, channel string, _ any) error {
	if channel == f.failOn {
		return errors.New("redis caído")
	}
	f.channels = append(f.channels, channel)
	return nil
}

func newService(store *fakeStore, pub *fakePublisher) *LockService {
	return NewLockService(store, pub, 5*time.Minute)
}

func TestLockPublicaSoloSiElBloqueoEsNuevo(t *testing.T) {
	req := model.LockRequest{ShowtimeID: 1, SeatID: "A1", UserID: 7}

	pub := &fakePublisher{}
	if _, created, err := newService(&fakeStore{acquireCreated: true}, pub).Lock(context.Background(), req); err != nil || !created {
		t.Fatalf("esperaba bloqueo nuevo, created=%v err=%v", created, err)
	}
	if len(pub.channels) != 1 || pub.channels[0] != model.ChannelSeatLocked {
		t.Fatalf("esperaba seat.locked, publicado: %v", pub.channels)
	}

	pub = &fakePublisher{}
	if _, _, err := newService(&fakeStore{acquireCreated: false}, pub).Lock(context.Background(), req); err != nil {
		t.Fatal(err)
	}
	if len(pub.channels) != 0 {
		t.Fatalf("un bloqueo existente no debe publicar, publicado: %v", pub.channels)
	}
}

func TestLockPropagaErroresDeDominio(t *testing.T) {
	store := &fakeStore{acquireErr: model.ErrSeatLocked}
	_, _, err := newService(store, &fakePublisher{}).Lock(context.Background(), model.LockRequest{ShowtimeID: 1, SeatID: "A1", UserID: 7})
	if !errors.Is(err, model.ErrSeatLocked) {
		t.Fatalf("esperaba ErrSeatLocked, obtuve %v", err)
	}
}

func TestUnlockPublicaLiberacion(t *testing.T) {
	pub := &fakePublisher{}
	if err := newService(&fakeStore{}, pub).Unlock(context.Background(), 1, "A1", 7); err != nil {
		t.Fatal(err)
	}
	if len(pub.channels) != 1 || pub.channels[0] != model.ChannelSeatReleased {
		t.Fatalf("esperaba seat.released, publicado: %v", pub.channels)
	}
}

func TestVerifyDevuelveLosAsientosQueNoSonDelUsuario(t *testing.T) {
	store := &fakeStore{owners: map[string]int64{"A1": 7, "A2": 9, "A3": 0}}
	missing, err := newService(store, &fakePublisher{}).Verify(context.Background(),
		model.VerifyRequest{ShowtimeID: 1, UserID: 7, SeatIDs: []string{"A1", "A2", "A3"}})
	if err != nil {
		t.Fatal(err)
	}
	if len(missing) != 2 || missing[0] != "A2" || missing[1] != "A3" {
		t.Fatalf("esperaba [A2 A3], obtuve %v", missing)
	}
}

func TestMarkSoldMarcaYPublicaAmbosEventos(t *testing.T) {
	store, pub := &fakeStore{}, &fakePublisher{}
	purchase := model.Purchase{ShowtimeID: 1, Tickets: []model.Ticket{{SeatID: "B1"}, {SeatID: "B2"}}}

	if err := newService(store, pub).MarkSold(context.Background(), purchase); err != nil {
		t.Fatal(err)
	}
	if !store.marked || len(store.soldSeats) != 2 {
		t.Fatalf("no se marcaron los asientos: %v", store.soldSeats)
	}
	want := []string{model.ChannelSeatSold, model.ChannelPurchaseConfirmed}
	if len(pub.channels) != 2 || pub.channels[0] != want[0] || pub.channels[1] != want[1] {
		t.Fatalf("esperaba %v, publicado: %v", want, pub.channels)
	}
}

func TestMarkSoldFallaSiNoSePuedePublicar(t *testing.T) {
	pub := &fakePublisher{failOn: model.ChannelPurchaseConfirmed}
	purchase := model.Purchase{ShowtimeID: 1, Tickets: []model.Ticket{{SeatID: "B1"}}}
	if err := newService(&fakeStore{}, pub).MarkSold(context.Background(), purchase); err == nil {
		t.Fatal("esperaba error para que el gateway reintente")
	}
}

func TestOnLockExpiredIgnoraLlavesAjenas(t *testing.T) {
	pub := &fakePublisher{}
	s := newService(&fakeStore{}, pub)

	s.OnLockExpired(context.Background(), "sesion:123")
	if len(pub.channels) != 0 {
		t.Fatalf("no debía publicar, publicado: %v", pub.channels)
	}
	s.OnLockExpired(context.Background(), "lock:4:C7")
	if len(pub.channels) != 1 || pub.channels[0] != model.ChannelSeatReleased {
		t.Fatalf("esperaba seat.released, publicado: %v", pub.channels)
	}
}
