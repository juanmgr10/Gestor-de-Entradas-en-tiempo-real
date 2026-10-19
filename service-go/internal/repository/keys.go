package repository

import (
	"fmt"
	"strconv"
	"strings"
)

// Esquema de llaves en Redis:
//
//	lock:{showtimeId}:{seatId} -> userId (con TTL)
//	sold:{showtimeId}          -> SET de asientos vendidos
const lockPrefix = "lock:"

func LockKey(showtimeID int64, seatID string) string {
	return fmt.Sprintf("%s%d:%s", lockPrefix, showtimeID, seatID)
}

func SoldKey(showtimeID int64) string {
	return fmt.Sprintf("sold:%d", showtimeID)
}

// ParseLockKey extrae función y asiento de una llave de bloqueo.
func ParseLockKey(key string) (showtimeID int64, seatID string, ok bool) {
	parts := strings.Split(strings.TrimPrefix(key, lockPrefix), ":")
	if !strings.HasPrefix(key, lockPrefix) || len(parts) != 2 {
		return 0, "", false
	}
	id, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		return 0, "", false
	}
	return id, parts[1], true
}
