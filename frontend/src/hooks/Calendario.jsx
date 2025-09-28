import React, { useState, useMemo, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";

moment.locale("es");
const localizer = momentLocalizer(moment);

// Mapea getDay() -> key en inglés (estable)
const DAY_KEYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

// Helpers
const hhmmToMinutes = (hhmm = "00:00") => {
  const [h, m] = String(hhmm).split(":").map((n) => parseInt(n || "0", 10));
  return (h * 60) + (m || 0);
};
const dateToMinutes = (d) => d.getHours() * 60 + d.getMinutes();
const minutesToDate = (mins) => {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const d = new Date(base);
  d.setMinutes(mins);
  return d;
};

function EventComponent({ event }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-white text-[0.85em] rounded px-1 py-0.5"
      style={{ backgroundColor: event.color }}
    >
      <div className="font-bold text-[11px]">
        {moment(event.start).format("HH:mm")} - {moment(event.end).format("HH:mm")}
      </div>
      <div className="text-[12px]">{event.title}</div>
    </div>
  );
}

export default function Calendario({
  turnos = [],
  onSelectEvent = () => {},
  onSelectSlot = () => {},
  defaultView = "month",
  // días habilitados (["monday",...]). Si no viene, deduzco de workingHours
  workingDayKeys = null,
  // bloques por día { monday: [{from,to}], ... }
  workingHours = null,
  // notificar la fecha navegada
  onDateChange = null,
}) {
  const [view, setView] = useState(defaultView);
  const [date, setDate] = useState(new Date());

  // Notificá al padre la fecha navegada
  useEffect(() => {
    onDateChange?.(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, view]);

  // Normalizo bloques a minutos
  const normalizedBlocks = useMemo(() => {
    if (!workingHours) return null;
    const map = {};
    for (const day of DAY_KEYS) {
      const arr = Array.isArray(workingHours?.[day]) ? workingHours[day] : [];
      map[day] = arr
        .filter(b => b?.from && b?.to)
        .map(b => ({ fromMin: hhmmToMinutes(b.from), toMin: hhmmToMinutes(b.to) }))
        .filter(b => b.fromMin < b.toMin);
    }
    return map;
  }, [workingHours]);

  // Días permitidos
  const allowedSet = useMemo(() => {
    let base = workingDayKeys;
    if ((!base || base.length === 0) && normalizedBlocks) {
      base = DAY_KEYS.filter((k) => (normalizedBlocks[k]?.length || 0) > 0);
    }
    if (!base || base.length === 0) base = DAY_KEYS;
    return new Set(base);
  }, [workingDayKeys, normalizedBlocks]);

  const isAllowedDay = (d) => allowedSet.has(DAY_KEYS[new Date(d).getDay()]);

  // ¿la celda puntual está dentro de un bloque?
  const isAllowedSlot = (d) => {
    if (!isAllowedDay(d)) return false;
    if (!normalizedBlocks) return true; // si no hay detalle, basta con el día
    const key = DAY_KEYS[new Date(d).getDay()];
    const blocks = normalizedBlocks[key] || [];
    if (blocks.length === 0) return false;
    const mins = dateToMinutes(d);
    return blocks.some((b) => mins >= b.fromMin && mins < b.toMin);
  };

  // Eventos
  const events = (turnos || []).map((t) => ({
    ...t,
    start: typeof t.start === "string" ? moment.parseZone(t.start).toDate() : t.start,
    end: typeof t.end === "string" ? moment.parseZone(t.end).toDate() : t.end,
    color: t.color || (t.cliente ? "#d32f2f" : "#1976d2"),
  }));

  const eventStyleGetter = () => ({
    style: {
      color: "#fff",
      borderRadius: "0.375rem",
      padding: "0.25rem 0.5rem",
      fontSize: "0.85em",
      textAlign: "center",
    },
  });

  const messages = {
    allDay: "Todo el día",
    previous: "Anterior",
    next: "Siguiente",
    today: "Hoy",
    month: "Mes",
    week: "Semana",
    day: "Día",
    agenda: "Agenda",
    date: "Fecha",
    time: "Hora",
    event: "Turno",
    noEventsInRange: "No hay turnos en este rango.",
    showMore: (n) => `+ Ver más (${n})`,
  };

  // Pintado de día no hábil
  const dayPropGetter = (dateObj) => {
    if (isAllowedDay(dateObj)) return {};
    return {
      style: {
        background:
          "repeating-linear-gradient(135deg, #f1f5f9 0px, #f1f5f9 6px, #eef2ff 6px, #eef2ff 12px)",
        filter: "grayscale(0.25)",
        opacity: 0.65,
      },
    };
  };

  // Pintado de slot fuera de bloque (y sin click)
  const slotPropGetter = (dateObj) => {
    if (isAllowedSlot(dateObj)) return {};
    return {
      style: {
        background:
          "repeating-linear-gradient(135deg, #f8fafc 0px, #f8fafc 6px, #eef2ff 6px, #eef2ff 12px)",
        opacity: 0.5,
        pointerEvents: "none",
      },
    };
  };

  // Bloquea selección fuera de bloque
  const onSelecting = ({ start, end }) => {
    const okStart = isAllowedSlot(start);
    const okEnd = end ? isAllowedSlot(end) : okStart;
    return okStart && okEnd;
  };

  // Time-grid min/max segun los bloques configurados
  const { globalMinDate, globalMaxDate, scrollToTime } = useMemo(() => {
    if (!normalizedBlocks) {
      const min = minutesToDate(8 * 60);   // fallback 08:00
      const max = minutesToDate(20 * 60);  // fallback 20:00
      return { globalMinDate: min, globalMaxDate: max, scrollToTime: min };
    }
    let minM = 24 * 60, maxM = 0;
    for (const day of DAY_KEYS) {
      for (const b of (normalizedBlocks[day] || [])) {
        if (b.fromMin < minM) minM = b.fromMin;
        if (b.toMin > maxM) maxM = b.toMin;
      }
    }
    if (minM >= maxM) { minM = 8 * 60; maxM = 20 * 60; }
    const minD = minutesToDate(minM);
    const maxD = minutesToDate(maxM);
    return { globalMinDate: minD, globalMaxDate: maxD, scrollToTime: minD };
  }, [normalizedBlocks]);

  return (
    <div className="max-w-[900px] mx-auto font-sans calendario-wrapper">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={["month", "week", "day", "agenda"]}
        view={view}
        date={date}
        onView={(v) => setView(v)}
        onNavigate={(newDate) => { setDate(newDate); onDateChange?.(newDate); }}
        selectable
        onSelecting={onSelecting}
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        components={{ event: EventComponent }}
        messages={messages}
        eventPropGetter={eventStyleGetter}
        dayPropGetter={dayPropGetter}
        slotPropGetter={slotPropGetter}
        min={globalMinDate}
        max={globalMaxDate}
        scrollToTime={scrollToTime}
        formats={{
          dayFormat: (date, culture, localizer) =>
            localizer.format(date, "dddd DD", culture),
          weekdayFormat: (date, culture, localizer) =>
            localizer.format(date, "dddd", culture),
          monthHeaderFormat: (date, culture, localizer) =>
            localizer.format(date, "MMMM YYYY", culture),
        }}
        popup
        style={{ minHeight: 480 }}
      />
    </div>
  );
}
