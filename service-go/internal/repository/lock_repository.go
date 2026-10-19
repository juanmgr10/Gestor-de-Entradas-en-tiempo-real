package repository

import (
	"context"
	"errors"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/reservas/service-go/internal/model"
)

// Bloqueo atómico: rechaza si está vendido, crea si está libre y es idempotente para el mismo dueño.
// Retorna {estado, ttlMs}: 1 = creado, 2 = ya era del usuario, 0 = de otro usuario, -1 = vendido.
var lockScript = redis.NewScript(`
if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 1 then return {-1, 0} end
local owner = redis.call('GET', KEYS[1])
if not owner then
  redis.call('SET', KEYS[1], ARGV[2], 'PX', ARGV[3])
  return {1, tonumber(ARGV[3])}
end
if owner == ARGV[2] then return {2, redis.call('PTTL', KEYS[1])} end
return {0, 0}
`)

// Liberación solo por el dueño (compare-and-delete). 1 = liberado, 0 = no existe, -1 = otro dueño.
var unlockScript = redis.NewScript(`
local owner = redis.call('GET', KEYS[1])
if not owner then return 0 end
if owner ~= ARGV[1] then return -1 end
redis.call('DEL', KEYS[1])
return 1
`)

// LockRepository encapsula el acceso a Redis para bloqueos y asientos vendidos.
type LockRepository struct {
	rdb *redis.Client
}

func NewLockRepository(rdb *redis.Client) *LockRepository {
	return &LockRepository{rdb: rdb}
}

// Acquire intenta bloquear el asiento. created indica si el bloqueo es nuevo.
func (r *LockRepository) Acquire(ctx context.Context, showtimeID int64, seatID string, userID int64, ttl time.Duration) (expiresAt time.Time, created bool, err error) {
	keys := []string{LockKey(showtimeID, seatID), SoldKey(showtimeID)}
	res, err := lockScript.Run(ctx, r.rdb, keys, seatID, userID, ttl.Milliseconds()).Int64Slice()
	if err != nil {
		return time.Time{}, false, err
	}
	switch res[0] {
	case -1:
		return time.Time{}, false, model.ErrSeatSold
	case 0:
		return time.Time{}, false, model.ErrSeatLocked
	}
	return time.Now().Add(time.Duration(res[1]) * time.Millisecond), res[0] == 1, nil
}

func (r *LockRepository) Release(ctx context.Context, showtimeID int64, seatID string, userID int64) error {
	res, err := unlockScript.Run(ctx, r.rdb, []string{LockKey(showtimeID, seatID)}, userID).Int64()
	if err != nil {
		return err
	}
	switch res {
	case 0:
		return model.ErrLockNotFound
	case -1:
		return model.ErrNotLockOwner
	}
	return nil
}

// Owners devuelve el dueño de cada asiento (0 si no está bloqueado).
func (r *LockRepository) Owners(ctx context.Context, showtimeID int64, seatIDs []string) (map[string]int64, error) {
	keys := make([]string, len(seatIDs))
	for i, s := range seatIDs {
		keys[i] = LockKey(showtimeID, s)
	}
	vals, err := r.rdb.MGet(ctx, keys...).Result()
	if err != nil {
		return nil, err
	}
	owners := make(map[string]int64, len(seatIDs))
	for i, v := range vals {
		owners[seatIDs[i]] = parseUserID(v)
	}
	return owners, nil
}

// FindByShowtime lista los bloqueos vigentes de una función.
func (r *LockRepository) FindByShowtime(ctx context.Context, showtimeID int64) ([]model.Lock, error) {
	var keys []string
	iter := r.rdb.Scan(ctx, 0, LockKey(showtimeID, "*"), 200).Iterator()
	for iter.Next(ctx) {
		keys = append(keys, iter.Val())
	}
	if err := iter.Err(); err != nil {
		return nil, err
	}

	// Una sola ida y vuelta para leer dueño y TTL de cada llave
	pipe := r.rdb.Pipeline()
	gets := make([]*redis.StringCmd, len(keys))
	ttls := make([]*redis.DurationCmd, len(keys))
	for i, k := range keys {
		gets[i] = pipe.Get(ctx, k)
		ttls[i] = pipe.PTTL(ctx, k)
	}
	if _, err := pipe.Exec(ctx); err != nil && !errors.Is(err, redis.Nil) {
		return nil, err
	}

	locks := make([]model.Lock, 0, len(keys))
	now := time.Now()
	for i, k := range keys {
		owner, err := gets[i].Result()
		if err != nil || ttls[i].Val() <= 0 {
			continue // expiró entre el SCAN y la lectura
		}
		_, seatID, _ := ParseLockKey(k)
		locks = append(locks, model.Lock{
			ShowtimeID: showtimeID,
			SeatID:     seatID,
			UserID:     parseUserID(owner),
			ExpiresAt:  now.Add(ttls[i].Val()),
		})
	}
	return locks, nil
}

// MarkSold registra los asientos como vendidos y elimina sus bloqueos en una transacción.
// Es idempotente: repetirlo no cambia el resultado.
func (r *LockRepository) MarkSold(ctx context.Context, showtimeID int64, seatIDs []string) error {
	members := make([]any, len(seatIDs))
	lockKeys := make([]string, len(seatIDs))
	for i, s := range seatIDs {
		members[i] = s
		lockKeys[i] = LockKey(showtimeID, s)
	}
	_, err := r.rdb.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		pipe.SAdd(ctx, SoldKey(showtimeID), members...)
		pipe.Del(ctx, lockKeys...)
		return nil
	})
	return err
}

func (r *LockRepository) Ping(ctx context.Context) error {
	return r.rdb.Ping(ctx).Err()
}

func parseUserID(v any) int64 {
	s, ok := v.(string)
	if !ok {
		return 0
	}
	id, _ := strconv.ParseInt(s, 10, 64)
	return id
}
