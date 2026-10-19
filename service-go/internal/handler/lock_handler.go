package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/reservas/service-go/internal/model"
	"github.com/reservas/service-go/internal/service"
)

type LockHandler struct {
	service *service.LockService
}

func NewLockHandler(s *service.LockService) *LockHandler {
	return &LockHandler{service: s}
}

// POST /locks
func (h *LockHandler) Lock(c *gin.Context) {
	var req model.LockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "datos de entrada inválidos", err.Error())
		return
	}
	lock, created, err := h.service.Lock(c.Request.Context(), req)
	if err != nil {
		respondDomainError(c, err)
		return
	}
	status := http.StatusOK
	if created {
		status = http.StatusCreated
	}
	c.JSON(status, lock)
}

// DELETE /locks/:showtimeId/:seatId?userId=
func (h *LockHandler) Unlock(c *gin.Context) {
	showtimeID, ok := parsePositiveID(c, c.Param("showtimeId"), "showtimeId")
	if !ok {
		return
	}
	userID, ok := parsePositiveID(c, c.Query("userId"), "userId")
	if !ok {
		return
	}
	seatID := c.Param("seatId")
	if !isValidSeat(seatID) {
		respondError(c, http.StatusBadRequest, "formato de asiento inválido (ej. A1)")
		return
	}
	if err := h.service.Unlock(c.Request.Context(), showtimeID, seatID, userID); err != nil {
		respondDomainError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// GET /locks/:showtimeId
func (h *LockHandler) ListByShowtime(c *gin.Context) {
	showtimeID, ok := parsePositiveID(c, c.Param("showtimeId"), "showtimeId")
	if !ok {
		return
	}
	locks, err := h.service.ListLocks(c.Request.Context(), showtimeID)
	if err != nil {
		respondDomainError(c, err)
		return
	}
	c.JSON(http.StatusOK, locks)
}

// POST /locks/verify
func (h *LockHandler) Verify(c *gin.Context) {
	var req model.VerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "datos de entrada inválidos", err.Error())
		return
	}
	missing, err := h.service.Verify(c.Request.Context(), req)
	if err != nil {
		respondDomainError(c, err)
		return
	}
	if len(missing) > 0 {
		respondError(c, http.StatusConflict, "el usuario no tiene bloqueados todos los asientos", missing...)
		return
	}
	c.JSON(http.StatusOK, gin.H{"valid": true})
}

// POST /seats/sold
func (h *LockHandler) MarkSold(c *gin.Context) {
	var purchase model.Purchase
	if err := c.ShouldBindJSON(&purchase); err != nil {
		respondError(c, http.StatusBadRequest, "datos de entrada inválidos", err.Error())
		return
	}
	if err := h.service.MarkSold(c.Request.Context(), purchase); err != nil {
		respondDomainError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func parsePositiveID(c *gin.Context, raw, name string) (int64, bool) {
	id, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || id <= 0 {
		respondError(c, http.StatusBadRequest, "parámetro inválido: "+name)
		return 0, false
	}
	return id, true
}
