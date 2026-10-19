package model

import "time"

// Canales de Redis Pub/Sub publicados por este servicio.
const (
	ChannelSeatLocked        = "seat.locked"
	ChannelSeatReleased      = "seat.released"
	ChannelSeatSold          = "seat.sold"
	ChannelPurchaseConfirmed = "purchase.confirmed"
)

// Motivos de liberación de un asiento.
const (
	ReleaseReasonCancelled = "cancelled"
	ReleaseReasonExpired   = "expired"
)

type SeatLockedEvent struct {
	ShowtimeID int64     `json:"showtimeId"`
	SeatID     string    `json:"seatId"`
	UserID     int64     `json:"userId"`
	ExpiresAt  time.Time `json:"expiresAt"`
}

type SeatReleasedEvent struct {
	ShowtimeID int64  `json:"showtimeId"`
	SeatID     string `json:"seatId"`
	Reason     string `json:"reason"`
}

type SeatSoldEvent struct {
	ShowtimeID int64    `json:"showtimeId"`
	SeatIDs    []string `json:"seatIds"`
}
