package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func NewRouter(locks *LockHandler, pinger Pinger) *gin.Engine {
	RegisterValidators()

	r := gin.New()
	r.Use(gin.LoggerWithConfig(gin.LoggerConfig{SkipPaths: []string{"/health"}}), gin.Recovery())

	r.GET("/health", Health(pinger))

	r.POST("/locks", locks.Lock)
	r.POST("/locks/verify", locks.Verify)
	r.GET("/locks/:showtimeId", locks.ListByShowtime)
	r.DELETE("/locks/:showtimeId/:seatId", locks.Unlock)
	r.POST("/seats/sold", locks.MarkSold)

	r.NoRoute(func(c *gin.Context) {
		respondError(c, http.StatusNotFound, "ruta no encontrada")
	})
	return r
}
