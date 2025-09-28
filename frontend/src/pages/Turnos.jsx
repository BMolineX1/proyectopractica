// src/pages/Turnos.jsx
import React, { useState, useEffect, useContext, useMemo } from "react";
import { useParams } from "react-router-dom";
import moment from "moment";
import Calendario from "../hooks/Calendario";
import ServicesModal from "../hooks/ServicesModal";
import HoursModal from "../hooks/HoursModal";
import Modal from "../hooks/Modal";
import { useTurnos } from "../hooks/useTurnos";
import { UserContext } from "../context/UserContext";
import api from "../components/api";

const ES2EN = {
  lunes: "monday", martes: "tuesday", miércoles: "wednesday", miercoles: "wednesday",
  jueves: "thursday", viernes: "friday", sábado: "saturday", sabado: "saturday",
  domingo: "sunday",
};
const EN2ES_TIT = {
  monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles", thursday: "Jueves",
  friday: "Viernes", saturday: "Sábado", sunday: "Domingo",
};

export default function Turnos() {
  const { user } = useContext(UserContext);
  const { codigo } = useParams(); // /reservar/:codigo

  // ====== Owner detection ======
  const [myEmp, setMyEmp] = useState(null);
  const [gridOwner, setGridOwner] = useState(null);
  const [loadingMyEmp, setLoadingMyEmp] = useState(!!user);
  const [loadingOwner, setLoadingOwner] = useState(true);

  const sameId = (a, b) => a != null && b != null && String(a) === String(b);
  const isOwner = useMemo(() => !!(myEmp && gridOwner && sameId(myEmp.id, gridOwner.id)), [myEmp, gridOwner]);
  const stillLoading = loadingMyEmp || loadingOwner;

  // ====== UI state ======
  const [showAddModal, setShowAddModal] = useState(false);     // dueño
  const [showEditModal, setShowEditModal] = useState(false);   // dueño
  const [showReserveModal, setShowReserveModal] = useState(false); // cliente (turno pre-creado)
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [slotToAdd, setSlotToAdd] = useState(null);
  const [formAdd, setFormAdd] = useState({ servicioId: "", cliente: "", startISO: "" });

  const [selectedDate, setSelectedDate] = useState(new Date());

  // ====== Hours in EN keys ======
  const [hours, setHours] = useState({
    monday: [{ from: "09:00", to: "18:00" }],
    tuesday: [{ from: "09:00", to: "18:00" }],
    wednesday: [{ from: "09:00", to: "18:00" }],
    thursday: [{ from: "09:00", to: "18:00" }],
    friday: [{ from: "09:00", to: "18:00" }],
    saturday: [{ from: "09:00", to: "13:00" }],
    sunday: [],
  });

  // Hook “propietario”
  const {
    services, events, turnosForCalendar,
    addTurno, updateTurno, deleteTurno,
    normalizeEvent, refreshServices,
  } = useTurnos();

  // ====== Datos públicos para VISITANTE ======
  const [publicEvents, setPublicEvents] = useState([]);
  const [ownerServices, setOwnerServices] = useState([]);

  // Trae servicios del emprendedor, turnos por servicio y marca ocupados por capacidad (reserva inmediata)
  const fetchPublicData = async (empId) => {
    if (!empId || isOwner) return;
    try {
      // 1) Servicios del dueño
      const servCandidates = [
        `/emprendedores/${empId}/servicios`,
        `/servicios?emprendedor_id=${empId}`,
      ];
      let servs = [];
      for (const url of servCandidates) {
        try {
          const r = await api.get(url);
          servs = Array.isArray(r.data) ? r.data : (r.data?.items || r.data || []);
          if (servs.length) break;
        } catch (e) {
          if (e?.response?.status !== 404) console.warn("Servicios no disponibles en", url, e?.response?.data || e);
        }
      }
      const byId = new Map((servs || []).map(s => [s.id, s]));

      // 2) Turnos del dueño: traer por CADA servicio
      let turns = [];
      for (const s of servs) {
        try {
          const r = await api.get(`/servicios/${s.id}/turnos`);
          const arr = Array.isArray(r.data) ? r.data : (r.data?.items || r.data || []);
          turns.push(...arr);
        } catch (e) {
          if (e?.response?.status !== 404) console.warn("Turnos no disponibles para servicio", s.id, e?.response?.data || e);
        }
      }

      // 3) Reservas del emprendedor (para marcar ocupados)
      let reservas = [];
      try {
        const r = await api.get(`/reservas`, { params: { emprendedor_id: empId } });
        reservas = Array.isArray(r.data) ? r.data : (r.data?.items || r.data || []);
      } catch (e) {
        if (e?.response?.status !== 404) console.warn("Reservas no disponibles", e?.response?.data || e);
      }

      // Contar reservas por turno (capacidad)
      const countByTurno = new Map();
      (reservas || []).forEach(r => {
        const k = r.turno_id;
        countByTurno.set(k, (countByTurno.get(k) || 0) + 1);
      });

      // 4) Enriquecer + marcar ocupado/libre
      const enriched = (turns || []).map(t => {
        const s = t.servicio || byId.get(t.servicio_id) || null;
        const count = countByTurno.get(t.id) || 0;
        const cap = Number(t.capacidad ?? 1);
        const ocupado = count >= cap;           // si alcanzó la capacidad, está ocupado
        return {
          ...t,
          servicio: s,
          reservas_count: count,
          reservado: ocupado,
          color: ocupado ? "#9ca3af" : "#16a34a", // gris si ocupado, verde si libre
          emprendedor_id: s?.emprendedor_id ?? t.emprendedor_id ?? empId,
        };
      });

      setOwnerServices(servs);
      setPublicEvents(enriched);
    } catch (err) {
      console.error("Error cargando turnos públicos:", err);
      setPublicEvents([]);
    }
  };

  // ====== Bootstrap: my emprendedor ======
  useEffect(() => {
    let canceled = false;
    (async () => {
      if (!user) { setLoadingMyEmp(false); return; }
      try {
        setLoadingMyEmp(true);
        const r = await api.get("/emprendedores/mi");
        if (!canceled) setMyEmp(r.data || null);
      } catch {
        if (!canceled) setMyEmp(null);
      } finally {
        if (!canceled) setLoadingMyEmp(false);
      }
    })();
    return () => { canceled = true; };
  }, [user]);

  // ====== Resolve grid owner ======
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        setLoadingOwner(true);
        if (codigo) {
          const r = await api.get(`/emprendedores/by-codigo/${codigo}`);
          if (!canceled) setGridOwner(r.data || null);
        } else {
          if (!canceled) setGridOwner(prev => prev ?? myEmp ?? null);
        }
      } catch {
        if (!canceled) setGridOwner(null);
      } finally {
        if (!canceled) setLoadingOwner(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo, myEmp?.id]);

  // Cuando cambia el dueño y soy visitante, traigo sus turnos/servicios públicos
  useEffect(() => {
    if (!gridOwner?.id) return;
    if (!isOwner) fetchPublicData(gridOwner.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridOwner?.id, isOwner]);

  // ====== Fetch hours (normalize to EN keys) ======
  const fetchHours = async () => {
    const effectiveEmpId = gridOwner?.id ?? myEmp?.id ?? user?.emprendimiento_id;
    if (!effectiveEmpId) return;

    const normalizeHours = (data) => {
      const map = {
        monday: [], tuesday: [], wednesday: [],
        thursday: [], friday: [], saturday: [], sunday: []
      };
      (data || []).forEach((h) => {
        const raw = String(h.dia_semana || h.dia || h.day || "").trim().toLowerCase();
        const deacc = raw.normalize("NFD").replace(/\p{Diacritic}/gu, "");
        const key = ES2EN[deacc] || deacc;
        if (!map[key]) return;
        const ini = ("" + (h.hora_inicio || h.desde || h.start)).slice(0, 5);
        const fin = ("" + (h.hora_fin || h.hasta  || h.end)).slice(0, 5);
        if (ini && fin) map[key].push({ from: ini, to: fin });
      });
      return map;
    };

    const candidates = [
      `/emprendedores/${effectiveEmpId}/horarios`,
      `/horarios?emprendedor_id=${effectiveEmpId}`,
      `/horarios/${effectiveEmpId}`,
    ];

    let obtained = null;
    for (const url of candidates) {
      try {
        const r = await api.get(url);
        obtained = Array.isArray(r.data) ? r.data : (r.data?.items || r.data || []);
        break;
      } catch (e) {
        if (e?.response?.status === 404) continue;
        console.warn("No se pudo leer horarios desde", url, e?.response?.data || e);
      }
    }

    if (obtained == null) {
      console.warn("No encontré endpoint de horarios; mantengo los horarios en memoria.");
      return;
    }

    setHours(normalizeHours(obtained));
  };

  useEffect(() => { fetchHours(); /* eslint-disable-next-line */ }, [gridOwner?.id]);

  // ====== Helpers ======
  const dayKeyENFromDate = (dateObj) => {
    const es = moment(dateObj).format("dddd").toLowerCase();
    const deacc = es.normalize("NFD").replace(/\p{Diacritic}/gu, "");
    return ES2EN[deacc] || deacc;
  };

  const workingDayKeys = useMemo(() =>
    Object.entries(hours).filter(([k, arr]) => (arr?.length || 0) > 0).map(([k]) => k),
  [hours]);

  // ====== Límite 1 reserva activa para visitante ======
  const [hasActiveReservation, setHasActiveReservation] = useState(false);
  const [checkingActiveRes, setCheckingActiveRes] = useState(false);

  const refreshHasActiveReservation = async () => {
    if (!user?.id || !gridOwner?.id || isOwner) return;
    setCheckingActiveRes(true);
    try {
      const { data } = await api.get(`/usuarios/${user.id}/reservas`);
      const now = moment();
      const has = (data || []).some(
        r => String(r.emprendedor_id) === String(gridOwner.id) &&
             moment(r.fecha_hora_inicio).isSameOrAfter(now)
      );
      setHasActiveReservation(has);
    } catch (e) {
      console.warn("No se pudo verificar reservas activas:", e?.response?.data || e);
      setHasActiveReservation(false);
    } finally {
      setCheckingActiveRes(false);
    }
  };

  useEffect(() => {
    refreshHasActiveReservation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, gridOwner?.id, isOwner]);

  // ====== Slot selection ======
  const [quickReserveOpen, setQuickReserveOpen] = useState(false);
  const [quickReserve, setQuickReserve] = useState({ startISO: "", servicioId: "" });

  const onSelectSlot = (slotInfo) => {
    // DUEÑO: sigue creando turnos normalmente
    if (isOwner) {
      const dayKey = dayKeyENFromDate(slotInfo.start);
      const bloques = hours[dayKey] || [];
      if (!bloques.length) {
        alert(`No se atiende los ${EN2ES_TIT[dayKey] || dayKey}.`);
        return;
      }
      const timeStr = moment(slotInfo.start).format("HH:mm");
      const isValid = bloques.some((b) => timeStr >= b.from && timeStr < b.to);
      if (!isValid) {
        alert("Horario fuera de los bloques definidos.");
        return;
      }
      setSlotToAdd({ start: slotInfo.start, end: slotInfo.end });
      setFormAdd({
        servicioId: services[0]?.id || "",
        cliente: "",
        startISO: moment(slotInfo.start).format("YYYY-MM-DDTHH:mm"),
      });
      setShowAddModal(true);
      return;
    }

    // CLIENTE: permitir reservar directo si está dentro de horario de atención
    const dayKey = dayKeyENFromDate(slotInfo.start);
    const bloques = hours[dayKey] || [];
    if (!bloques.length) {
      alert(`No se atiende los ${EN2ES_TIT[dayKey] || dayKey}.`);
      return;
    }
    const timeStr = moment(slotInfo.start).format("HH:mm");
    const isValid = bloques.some((b) => timeStr >= b.from && timeStr < b.to);
    if (!isValid) {
      alert("Horario fuera de los bloques definidos.");
      return;
    }
    // abrir modal para elegir servicio y confirmar
    setQuickReserve({
      startISO: moment(slotInfo.start).format("YYYY-MM-DDTHH:mm"),
      servicioId: ownerServices?.[0]?.id || "",
    });
    setQuickReserveOpen(true);
  };

  // ====== Click en EVENTO (turno pre-creado) ======
  const onSelectEvent = (evt) => {
    if (isOwner) {
      setSelectedEvent(evt);
      setShowEditModal(true);
      return;
    }
    if (evt.reservado) {
      alert("Ese turno ya está reservado.");
      return;
    }
    if (hasActiveReservation) {
      alert("Ya tenés una reserva activa con este emprendimiento.");
      return;
    }
    setSelectedEvent(evt);
    setShowReserveModal(true);
  };

  // ====== Mutations ======
  const handleAddTurno = async () => {
    try {
      await addTurno({ servicioId: formAdd.servicioId, startISO: formAdd.startISO, cliente: formAdd.cliente || undefined });
      setShowAddModal(false);
      setFormAdd({ servicioId: services[0]?.id || "", cliente: "", startISO: "" });
    } catch (err) {
      console.error("Error agregando turno:", err);
      alert("No se pudo agregar el turno. Revisá consola para detalles.");
    }
  };

  const handleEditTurno = async () => {
    if (!selectedEvent) return;
    try {
      await updateTurno(selectedEvent.id, { cliente: selectedEvent.cliente });
      setShowEditModal(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error("Error editando turno:", err);
      alert("No se pudo editar el turno.");
    }
  };

  const handleDeleteTurno = async () => {
    if (!selectedEvent) return;
    if (!confirm("¿Eliminar este turno?")) return;
    try {
      await deleteTurno(selectedEvent.id);
      setShowEditModal(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error("Error eliminando turno:", err);
      alert("No se pudo eliminar el turno.");
    }
  };

  // ====== Confirmar RESERVA (visitante) — inmediata (sobre turno ya creado) ======
  const [reserving, setReserving] = useState(false);
  const handleConfirmReserva = async () => {
    if (!selectedEvent || !user?.id) return;
    if (selectedEvent.reservado) { // doble chequeo
      alert("Ese turno ya está reservado.");
      return;
    }
    if (hasActiveReservation) {
      alert("Ya tenés una reserva activa con este emprendimiento.");
      return;
    }
    try {
      setReserving(true);
      await api.post("/reservas/", { turno_id: selectedEvent.id });
      setShowReserveModal(false);
      setSelectedEvent(null);
      await refreshHasActiveReservation();
      if (gridOwner?.id) await fetchPublicData(gridOwner.id); // refresca colores
      alert("¡Reserva confirmada!");
    } catch (err) {
      console.error("Error creando reserva:", err?.response?.data || err);
      const d = err?.response?.data;
      alert(d?.detail || "No se pudo realizar la reserva.");
    } finally {
      setReserving(false);
    }
  };

  // ====== Confirmar RESERVA DIRECTA (hueco vacío) ======
  const [reservingQuick, setReservingQuick] = useState(false);
  const handleConfirmQuickReserve = async () => {
    if (!quickReserve.startISO || !quickReserve.servicioId) return;
    if (hasActiveReservation) {
      alert("Ya tenés una reserva activa con este emprendimiento.");
      return;
    }
    try {
      setReservingQuick(true);
      await api.post("/reservas/directo", {
        servicio_id: Number(quickReserve.servicioId),
        fecha_hora_inicio: moment(quickReserve.startISO).toISOString(),
      });
      setQuickReserveOpen(false);
      await refreshHasActiveReservation();
      if (gridOwner?.id) await fetchPublicData(gridOwner.id); // refrescar colores
      alert("¡Reserva confirmada!");
    } catch (err) {
      console.error("Error en reserva directa:", err?.response?.data || err);
      alert(err?.response?.data?.detail || "No se pudo reservar ese horario.");
    } finally {
      setReservingQuick(false);
    }
  };

  // ====== Fuente de eventos según modo ======
  const eventsForCalendar = useMemo(() => {
    const src = isOwner ? turnosForCalendar : publicEvents || [];
    return src.map((e) => {
      const ne = normalizeEvent(e);
      const hora = moment(ne.start).format("HH:mm");
      const servicio = ne.servicio?.nombre || "Servicio";

      const titulo = isOwner
        ? `${hora} — ${servicio}${ne.cliente ? " — " + ne.cliente : ""}`
        : (e.reservado ? `${hora} — ${servicio} — Reservado` : `${hora} — ${servicio}`);

      return {
        ...ne,
        reservado: !!e.reservado,
        title: titulo,
        color: e.color ?? (e.reservado ? "#9ca3af" : "#16a34a"),
      };
    });
  }, [isOwner, turnosForCalendar, publicEvents, normalizeEvent]);

  const baseEventsForList = isOwner ? events : publicEvents;

  // ====== Turnos del día seleccionado (visitante / dueño)
  const turnosDelDia = (baseEventsForList || []).filter((e) =>
    moment(normalizeEvent(e).start).isSame(moment(selectedDate), "day")
  );

  const generarLinkTurno = () => {
    const code = gridOwner?.codigo_cliente || myEmp?.codigo_cliente;
    if (!code) {
      alert("Aún no hay código asignado a este emprendimiento.");
      return;
    }
    const url = `${window.location.origin}/reservar/${code}`;
    navigator.clipboard.writeText(url);
    alert(`Link copiado al portapapeles:\n${url}`);
  };

  // ====== AGENDA del día (solo dueño)
  const [agendaFecha, setAgendaFecha] = useState(moment().format("YYYY-MM-DD"));
  const [agendaItems, setAgendaItems] = useState([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);

  const fetchAgenda = async (fechaStr) => {
    if (!gridOwner?.id || !isOwner) return;
    setLoadingAgenda(true);
    try {
      const { data } = await api.get(`/emprendedores/${gridOwner.id}/reservas`, {
        params: { fecha: fechaStr },
      });
      setAgendaItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando agenda:", err);
      setAgendaItems([]);
    } finally {
      setLoadingAgenda(false);
    }
  };

  useEffect(() => {
    if (isOwner) fetchAgenda(agendaFecha);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, gridOwner?.id, agendaFecha]);

  useEffect(() => {
    if (isOwner && selectedDate) {
      setAgendaFecha(moment(selectedDate).format("YYYY-MM-DD"));
    }
  }, [isOwner, selectedDate]);

  // ====== UI ======
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-cyan-400 p-5">
      <div className="mx-auto max-w-6xl grid md:grid-cols-[1fr_320px] gap-5 font-inter">

        {/* Header */}
        <header className="md:col-span-2 rounded-2xl shadow-xl bg-white/20 backdrop-blur-md border border-white/30 p-5 flex flex-wrap items-center justify-between text-white">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold drop-shadow">Turnera — Gestión de Turnos</h1>
            <p className="text-white/90 text-sm">Configurá tus servicios, horarios y agenda.</p>
            {isOwner && gridOwner?.codigo_cliente && (
              <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-white/25">
                Código público: <b>{gridOwner.codigo_cliente}</b>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {stillLoading && (
              <span className="px-3 py-1 text-sm rounded bg-white/30 text-white">Cargando…</span>
            )}
            {!stillLoading && isOwner && (
              <>
                <button onClick={() => setShowServicesModal(true)} className="px-3 py-1 text-sm rounded-2xl bg-white/20 hover:bg-white/30 border border-white/40">
                  🧾 Servicios
                </button>
                <button onClick={() => setShowHoursModal(true)} className="px-3 py-1 text-sm rounded-2xl bg-white/20 hover:bg-white/30 border border-white/40">
                  🕒 Horarios
                </button>
                <button onClick={generarLinkTurno} className="px-3 py-1 text-sm rounded-2xl bg-white text-blue-700 shadow">
                  🔗 Generar link
                </button>
              </>
            )}
          </div>
        </header>

        {/* Calendario */}
        <main className="bg-white rounded-2xl shadow-xl p-4">
          <Calendario
            key={gridOwner?.id || "self"}            // fuerza remount al cambiar dueño
            turnos={eventsForCalendar}
            onSelectEvent={onSelectEvent}
            onSelectSlot={onSelectSlot}
            defaultView="week"
            workingDayKeys={workingDayKeys}
            workingHours={hours}
            onDateChange={setSelectedDate}
          />
        </main>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl shadow-xl bg-white/90 border border-gray-100 p-4 flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Acciones rápidas</h3>
            <p className="text-gray-600 text-xs">
              {isOwner
                ? "Seleccioná un turno en el calendario para editar o cancelar."
                : "Hacé clic en un espacio vacío del calendario (dentro del horario) para reservar."
              }
            </p>

            {/* Leyenda simple */}
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{background:"#16a34a"}}/> Disponible</span>
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{background:"#9ca3af"}}/> Ocupado</span>
            </div>

            {stillLoading && (
              <span className="px-3 py-1 text-sm rounded bg-gray-100 text-gray-500 w-fit">Cargando…</span>
            )}

            {!stillLoading && isOwner && (
              <div className="flex flex-col gap-2">
                <button className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm shadow" onClick={() => setShowAddModal(true)}>➕ Agregar turno</button>
                <button className="px-3 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm shadow" onClick={() => { if (!selectedEvent) return alert("Seleccioná un turno en el calendario."); setShowEditModal(true); }}>✏️ Editar / Posponer</button>
                <button className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm shadow" onClick={handleDeleteTurno}>❌ Cancelar</button>
              </div>
            )}

            {!stillLoading && !isOwner && gridOwner && (
              <div className="text-xs text-gray-600">
                {checkingActiveRes
                  ? "Verificando tus reservas…"
                  : hasActiveReservation
                    ? "Ya tenés una reserva activa con este emprendimiento."
                    : "Hacé clic en un espacio vacío del calendario para reservar."}
              </div>
            )}

            {!stillLoading && !gridOwner && (
              <div className="text-sm text-red-600">No se encontró el emprendimiento.</div>
            )}
          </div>

          {/* Agenda / Turnos del día */}
          {isOwner ? (
            <div className="rounded-2xl shadow-xl bg-white/90 border border-gray-100 p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-gray-800">Agenda del día</h3>
                <div className="flex items-center gap-2">
                  <button
                    className="px-2 py-1 text-xs rounded bg-white ring-1 ring-gray-200 hover:bg-gray-50"
                    onClick={() => setAgendaFecha(moment(agendaFecha).subtract(1, "day").format("YYYY-MM-DD"))}
                    title="Día anterior"
                  >
                    ◀
                  </button>
                  <button
                    className="px-2 py-1 text-xs rounded bg-white ring-1 ring-gray-200 hover:bg-gray-50"
                    onClick={() => setAgendaFecha(moment().format("YYYY-MM-DD"))}
                    title="Hoy"
                  >
                    Hoy
                  </button>
                  <button
                    className="px-2 py-1 text-xs rounded bg-white ring-1 ring-gray-200 hover:bg-gray-50"
                    onClick={() => setAgendaFecha(moment(agendaFecha).add(1, "day").format("YYYY-MM-DD"))}
                    title="Día siguiente"
                  >
                    ▶
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-3">
                {moment(agendaFecha).format("dddd DD/MM/YYYY")}
              </div>

              {loadingAgenda ? (
                <div className="text-sm text-gray-500">Cargando…</div>
              ) : agendaItems.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay reservas para este día.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {agendaItems.map((item) => (
                    <li key={item.id} className="flex gap-2 p-2 rounded hover:bg-gray-50">
                      <div className="w-20 shrink-0 font-semibold text-gray-800">
                        {moment(item.fecha_hora_inicio).format("HH:mm")}–{moment(item.fecha_hora_fin).format("HH:mm")}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{item.servicio_nombre}</div>
                        <div className="text-gray-600 text-sm">
                          {item.cliente_nombre}
                          {item.precio ? <span className="ml-2 text-gray-400">• ${item.precio}</span> : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="rounded-2xl shadow-xl bg-white/90 border border-gray-100 p-4">
              <h3 className="text-sm font-semibold">
                Turnos del {moment(selectedDate).format("DD/MM/YYYY")}
              </h3>
              {turnosDelDia.length === 0 ? (
                <p className="text-gray-500 text-xs mt-2">No hay turnos para este día</p>
              ) : (
                <ul className="divide-y divide-gray-100 mt-2">
                  {turnosDelDia.map((t) => {
                    const ne = normalizeEvent(t);
                    return (
                      <li
                        key={t.id}
                        className="flex gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          if (t.reservado) { alert("Ese turno ya está reservado."); return; }
                          if (hasActiveReservation) { alert("Ya tenés una reserva activa con este emprendimiento."); return; }
                          setSelectedEvent(t);
                          setShowReserveModal(true);
                        }}
                      >
                        <div className="w-20 font-semibold text-gray-800">
                          {moment(ne.start).format("HH:mm")}–{moment(ne.end).format("HH:mm")}
                        </div>
                        <div className="flex flex-col">
                          <div className="font-semibold text-gray-800">{t.servicio?.nombre}</div>
                          <div className="text-gray-500 text-sm">{t.cliente || (t.reservado ? "Reservado" : "")}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </aside>

        {/* Modales */}
        {showAddModal && isOwner && (
          <Modal onClose={() => setShowAddModal(false)}>
            <h3 className="text-lg font-semibold mb-2">Agregar turno</h3>
            <label className="text-sm text-gray-700">Servicio</label>
            <select className="w-full border rounded p-2 mb-2" value={formAdd.servicioId} onChange={(e) => setFormAdd({ ...formAdd, servicioId: e.target.value })}>
              {services.map(s => <option key={s.id} value={s.id}>{s.nombre} — {s.duracion} min</option>)}
            </select>
            <label className="text-sm text-gray-700">Cliente (opcional)</label>
            <input className="w-full border rounded p-2 mb-2" placeholder="Nombre del cliente" value={formAdd.cliente} onChange={(e) => setFormAdd({ ...formAdd, cliente: e.target.value })}/>
            <label className="text-sm text-gray-700">Fecha y hora inicio</label>
            <input type="datetime-local" className="w-full border rounded p-3 mb-3" value={formAdd.startISO} onChange={(e) => setFormAdd({ ...formAdd, startISO: e.target.value })}/>
            <button onClick={handleAddTurno} className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow">
              Agregar turno
            </button>
          </Modal>
        )}

        {showEditModal && selectedEvent && isOwner && (
          <Modal onClose={() => setShowEditModal(false)}>
            <h3 className="text-lg font-semibold mb-2">Editar turno</h3>
            <label className="text-sm text-gray-700">Cliente</label>
            <input className="w-full border rounded p-2 mb-3" value={selectedEvent.cliente || ""} onChange={(e) => setSelectedEvent({ ...selectedEvent, cliente: e.target.value })}/>
            <div className="flex gap-2">
              <button onClick={handleEditTurno} className="flex-1 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow">Guardar cambios</button>
              <button onClick={handleDeleteTurno} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow">Cancelar turno</button>
            </div>
          </Modal>
        )}

        {showReserveModal && selectedEvent && !isOwner && (
          <Modal onClose={() => setShowReserveModal(false)}>
            <h3 className="text-lg font-semibold mb-3">Confirmar reserva</h3>
            <div className="text-sm text-gray-700 mb-1">Servicio</div>
            <div className="mb-2 font-semibold">
              {selectedEvent?.servicio?.nombre || "Servicio"} {selectedEvent?.servicio?.duracion ? `— ${selectedEvent.servicio.duracion} min` : ""}
            </div>
            <div className="text-sm text-gray-700 mb-1">Fecha y hora</div>
            <div className="mb-4">
              {moment(normalizeEvent(selectedEvent).start).format("dddd DD/MM/YYYY HH:mm")} hs
            </div>
            {selectedEvent?.precio != null && (
              <>
                <div className="text-sm text-gray-700 mb-1">Precio</div>
                <div className="mb-4">${selectedEvent.precio}</div>
              </>
            )}
            <button
              disabled={reserving || hasActiveReservation || selectedEvent?.reservado}
              onClick={handleConfirmReserva}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white shadow"
            >
              {reserving ? "Reservando..." : "Confirmar reserva"}
            </button>
            {hasActiveReservation && (
              <p className="text-xs text-red-600 mt-2">Ya tenés una reserva activa con este emprendimiento.</p>
            )}
          </Modal>
        )}

        {/* Modal de RESERVA DIRECTA (hueco vacío) */}
        {quickReserveOpen && !isOwner && (
          <Modal onClose={() => setQuickReserveOpen(false)}>
            <h3 className="text-lg font-semibold mb-3">Reservar este horario</h3>

            <div className="text-sm text-gray-700 mb-1">Fecha y hora</div>
            <input
              type="datetime-local"
              className="w-full border rounded p-3 mb-3"
              value={quickReserve.startISO}
              onChange={(e) =>
                setQuickReserve((prev) => ({ ...prev, startISO: e.target.value }))
              }
            />

            <div className="text-sm text-gray-700 mb-1">Servicio</div>
            <select
              className="w-full border rounded p-2 mb-4"
              value={quickReserve.servicioId}
              onChange={(e) =>
                setQuickReserve((prev) => ({ ...prev, servicioId: e.target.value }))
              }
            >
              {(ownerServices || []).length === 0 ? (
                <option value="">(No hay servicios disponibles)</option>
              ) : (
                ownerServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} — {s.duracion} min {s.precio != null ? `($${s.precio})` : ""}
                  </option>
                ))
              )}
            </select>

            <button
              disabled={
                reservingQuick ||
                hasActiveReservation ||
                !quickReserve.servicioId ||
                !quickReserve.startISO
              }
              onClick={handleConfirmQuickReserve}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white shadow"
            >
              {reservingQuick ? "Reservando..." : "Confirmar reserva"}
            </button>

            {hasActiveReservation && (
              <p className="text-xs text-red-600 mt-2">
                Ya tenés una reserva activa con este emprendimiento.
              </p>
            )}
          </Modal>
        )}

        {showServicesModal && (
          <ServicesModal
            emprendedorId={gridOwner?.id}
            onClose={() => setShowServicesModal(false)}
            onServiceAdded={refreshServices}
          />
        )}

        {showHoursModal && (
          <HoursModal
            hours={hours}
            emprendimientoId={gridOwner?.id}
            onClose={() => setShowHoursModal(false)}
            refreshHours={fetchHours}
            onSaved={fetchHours}
          />
        )}
      </div>
    </div>
  );
}
