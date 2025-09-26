// src/Calendario.jsx
import React, { useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";

moment.locale("es");
const localizer = momentLocalizer(moment);

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
}) {
  const [view, setView] = useState(defaultView); // Vista actual
  const [date, setDate] = useState(new Date()); // Fecha actual

  const events = (turnos || []).map((t) => ({
    ...t,
    title: `${t.servicio}${t.cliente ? " — " + t.cliente : ""}`,
    start: typeof t.start === "string" ? moment.parseZone(t.start).toDate() : t.start,
    end: typeof t.end === "string" ? moment.parseZone(t.end).toDate() : t.end,
    color: t.color || (t.cliente ? "#d32f2f" : "#1976d2"),
  }));

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

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.color || "#1976d2",
      color: "#fff",
      borderRadius: "0.375rem",
      padding: "0.25rem 0.5rem",
      fontSize: "0.85em",
      textAlign: "center",
    },
  });

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
        onNavigate={(newDate) => setDate(newDate)}
        selectable
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        components={{ event: EventComponent }}
        messages={messages}
        eventPropGetter={eventStyleGetter}
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
