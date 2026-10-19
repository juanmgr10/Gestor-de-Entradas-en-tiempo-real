package handler

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/reservas/service-go/internal/model"
)

// ErrorResponse mantiene el mismo formato de error que el resto de servicios.
type ErrorResponse struct {
	Status  int      `json:"status"`
	Message string   `json:"message"`
	Details []string `json:"details"`
}

func respondError(c *gin.Context, status int, message string, details ...string) {
	if details == nil {
		details = []string{}
	}
	c.AbortWithStatusJSON(status, ErrorResponse{Status: status, Message: message, Details: details})
}

// respondDomainError traduce errores de dominio a códigos HTTP.
func respondDomainError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, model.ErrSeatLocked), errors.Is(err, model.ErrSeatSold):
		respondError(c, http.StatusConflict, err.Error())
	case errors.Is(err, model.ErrLockNotFound):
		respondError(c, http.StatusNotFound, err.Error())
	case errors.Is(err, model.ErrNotLockOwner):
		respondError(c, http.StatusForbidden, err.Error())
	default:
		slog.Error("error interno", "path", c.FullPath(), "error", err)
		respondError(c, http.StatusInternalServerError, "error interno del servidor")
	}
}
