package events

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/redis/go-redis/v9"
)

// ListenExpirations escucha las notificaciones de llaves expiradas de Redis
// (requiere notify-keyspace-events Ex) y entrega cada llave al handler.
// Bloquea hasta que se cancele el contexto.
func ListenExpirations(ctx context.Context, rdb *redis.Client, db int, handler func(ctx context.Context, key string)) {
	channel := fmt.Sprintf("__keyevent@%d__:expired", db)
	sub := rdb.Subscribe(ctx, channel)
	defer sub.Close()

	slog.Info("escuchando expiraciones", "channel", channel)
	ch := sub.Channel()
	for {
		select {
		case <-ctx.Done():
			return
		case msg, ok := <-ch:
			if !ok {
				return
			}
			handler(ctx, msg.Payload)
		}
	}
}
