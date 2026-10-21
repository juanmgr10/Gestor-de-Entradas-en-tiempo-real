package com.reservas.core.service;

import com.reservas.core.entity.Showtime;
import com.reservas.core.entity.ShowtimeSchedule;
import com.reservas.core.repository.ShowtimeRepository;
import com.reservas.core.repository.ShowtimeScheduleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * Mantiene la cartelera al día: genera las funciones de hoy y de los próximos días
 * a partir de los horarios fijos. Las funciones pasadas no se tocan (historial de compras).
 */
@Service
public class ShowtimeScheduler {

    private static final Logger log = LoggerFactory.getLogger(ShowtimeScheduler.class);

    private final ShowtimeScheduleRepository scheduleRepository;
    private final ShowtimeRepository showtimeRepository;
    private final ZoneId zone;
    private final int daysAhead;

    public ShowtimeScheduler(ShowtimeScheduleRepository scheduleRepository, ShowtimeRepository showtimeRepository,
                             @Value("${app.timezone}") String timezone,
                             @Value("${app.schedule.days-ahead}") int daysAhead) {
        this.scheduleRepository = scheduleRepository;
        this.showtimeRepository = showtimeRepository;
        this.zone = ZoneId.of(timezone);
        this.daysAhead = daysAhead;
    }

    @Transactional
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        generateUpcoming();
    }

    @Transactional
    @Scheduled(cron = "${app.schedule.cron}", zone = "${app.timezone}")
    public void daily() {
        generateUpcoming();
    }

    private void generateUpcoming() {
        LocalDate today = LocalDate.now(zone);
        OffsetDateTime now = OffsetDateTime.now();
        int created = 0;

        for (ShowtimeSchedule schedule : scheduleRepository.findActiveWithMovie()) {
            for (int day = 0; day < daysAhead; day++) {
                LocalDate date = today.plusDays(day);
                if (!schedule.appliesTo(date)) {
                    continue;
                }
                OffsetDateTime startsAt = ZonedDateTime.of(date, schedule.getStartTime(), zone).toOffsetDateTime();
                if (startsAt.isBefore(now) || showtimeRepository.existsByHallAndStartsAt(schedule.getHall(), startsAt)) {
                    continue;
                }
                showtimeRepository.save(fromSchedule(schedule, startsAt));
                created++;
            }
        }
        log.info("Cartelera actualizada: {} funciones nuevas (hasta {} días, zona {})", created, daysAhead, zone);
    }

    private Showtime fromSchedule(ShowtimeSchedule schedule, OffsetDateTime startsAt) {
        Showtime showtime = new Showtime();
        showtime.setMovie(schedule.getMovie());
        showtime.setSchedule(schedule);
        showtime.setHall(schedule.getHall());
        showtime.setStartsAt(startsAt);
        showtime.setPrice(schedule.getPrice());
        showtime.setSeatRows(schedule.getSeatRows());
        showtime.setSeatColumns(schedule.getSeatColumns());
        return showtime;
    }
}
