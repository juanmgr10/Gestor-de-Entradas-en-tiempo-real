-- Las funciones de ejemplo de V2 dependían de la fecha de instalación y no siguen los horarios fijos.
-- La cartelera se genera ahora desde showtime_schedules; se conservan solo si tienen boletos vendidos.
DELETE FROM showtimes s
WHERE s.schedule_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.showtime_id = s.id);
