package handler

import (
	"regexp"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

// Formato de asiento: fila (A-Z) + columna (1-99), ej. "A1", "H12".
var seatPattern = regexp.MustCompile(`^[A-Z][1-9][0-9]?$`)

// RegisterValidators agrega la regla "seat" al validador de Gin.
func RegisterValidators() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		_ = v.RegisterValidation("seat", func(fl validator.FieldLevel) bool {
			return seatPattern.MatchString(fl.Field().String())
		})
	}
}

func isValidSeat(seatID string) bool {
	return seatPattern.MatchString(seatID)
}
