package model

import "errors"

// Errores de dominio; el handler los traduce a códigos HTTP.
var (
	ErrSeatLocked   = errors.New("el asiento está bloqueado por otro usuario")
	ErrSeatSold     = errors.New("el asiento ya fue vendido")
	ErrLockNotFound = errors.New("el bloqueo no existe o ya expiró")
	ErrNotLockOwner = errors.New("el bloqueo pertenece a otro usuario")
)
