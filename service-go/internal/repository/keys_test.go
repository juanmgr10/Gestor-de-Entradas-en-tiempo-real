package repository

import "testing"

func TestParseLockKey(t *testing.T) {
	cases := []struct {
		key      string
		showtime int64
		seat     string
		ok       bool
	}{
		{"lock:1:A1", 1, "A1", true},
		{"lock:104:J16", 104, "J16", true},
		{LockKey(42, "D7"), 42, "D7", true},
		{"sold:1", 0, "", false},
		{"lock:abc:A1", 0, "", false},
		{"lock:1", 0, "", false},
		{"otra:lock:1:A1", 0, "", false},
	}
	for _, c := range cases {
		showtime, seat, ok := ParseLockKey(c.key)
		if ok != c.ok || showtime != c.showtime || seat != c.seat {
			t.Errorf("ParseLockKey(%q) = (%d, %q, %v); esperaba (%d, %q, %v)",
				c.key, showtime, seat, ok, c.showtime, c.seat, c.ok)
		}
	}
}
