package handler

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Pinger interface {
	Ping(ctx context.Context) error
}

// Health responde 200 si Redis está disponible.
func Health(p Pinger) gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := p.Ping(c.Request.Context()); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "DOWN", "redis": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "UP"})
	}
}
