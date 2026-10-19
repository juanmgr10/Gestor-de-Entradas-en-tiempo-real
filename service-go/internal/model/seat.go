package model

import "time"

// Lock representa un asiento bloqueado temporalmente por un usuario.
type Lock struct {
	ShowtimeID int64     `json:"showtimeId"`
	SeatID     string    `json:"seatId"`
	UserID     int64     `json:"userId"`
	ExpiresAt  time.Time `json:"expiresAt"`
}

type LockRequest struct {
	ShowtimeID int64  `json:"showtimeId" binding:"required,gt=0"`
	SeatID     string `json:"seatId" binding:"required,seat"`
	UserID     int64  `json:"userId" binding:"required,gt=0"`
}

// VerifyRequest comprueba que el usuario aún posee los bloqueos antes de pagar.
type VerifyRequest struct {
	ShowtimeID int64    `json:"showtimeId" binding:"required,gt=0"`
	UserID     int64    `json:"userId" binding:"required,gt=0"`
	SeatIDs    []string `json:"seatIds" binding:"required,min=1,max=10,dive,seat"`
}

type ShowtimeLocks struct {
	ShowtimeID int64  `json:"showtimeId"`
	Locks      []Lock `json:"locks"`
}

// Ticket y Purchase reflejan la respuesta de compra del core transaccional.
type Ticket struct {
	ID     int64  `json:"id" binding:"required"`
	Code   string `json:"code" binding:"required"`
	SeatID string `json:"seatId" binding:"required,seat"`
}

type Purchase struct {
	PaymentID   int64     `json:"paymentId" binding:"required"`
	UserID      int64     `json:"userId" binding:"required"`
	ShowtimeID  int64     `json:"showtimeId" binding:"required"`
	MovieID     int64     `json:"movieId" binding:"required"`
	MovieTitle  string    `json:"movieTitle" binding:"required"`
	Amount      float64   `json:"amount" binding:"gte=0"`
	Tickets     []Ticket  `json:"tickets" binding:"required,min=1,dive"`
	PurchasedAt time.Time `json:"purchasedAt" binding:"required"`
}

// SeatIDs devuelve los asientos incluidos en la compra.
func (p Purchase) SeatIDs() []string {
	ids := make([]string, len(p.Tickets))
	for i, t := range p.Tickets {
		ids[i] = t.SeatID
	}
	return ids
}
