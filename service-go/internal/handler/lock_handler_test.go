package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

// Valida la entrada antes de llegar a la capa de servicio (service nil: no debe invocarse).
func TestLockRechazaFormatoDeAsientoInvalido(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := NewRouter(NewLockHandler(nil), nil)

	cases := map[string]string{
		"asiento invertido": `{"showtimeId":1,"seatId":"1A","userId":7}`,
		"sin usuario":       `{"showtimeId":1,"seatId":"A1"}`,
		"json mal formado":  `{"showtimeId":`,
	}
	for name, body := range cases {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodPost, "/locks", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Errorf("%s: esperaba 400, obtuve %d (%s)", name, rec.Code, rec.Body.String())
		}
	}
}
