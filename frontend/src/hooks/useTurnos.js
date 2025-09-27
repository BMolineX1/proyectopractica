import { useState, useEffect, useMemo, useContext, useCallback } from "react";
import api from "../components/api";
import { UserContext } from "../context/UserContext";
import moment from "moment";

export const useTurnos = () => {
  const { user } = useContext(UserContext);
  const [services, setServices] = useState([]);
  const [events, setEvents] = useState([]);
  const [formAdd, setFormAdd] = useState({ servicioId: null });

  const refreshAllMine = useCallback(async () => {
    try {
      if (!user?.id) return;

      // 1) Mis servicios (nombre, duración, precio, emprendedor_id)
      const servRes = await api.get("/servicios/mis-servicios");
      const servicios = servRes.data || [];
      setServices(servicios);

      // 2) Mis turnos (no necesariamente incluye info del servicio)
      const turnRes = await api.get("/turnos/mis-turnos");
      const misTurnos = turnRes.data || [];

      // 3) Join por servicio_id para enriquecer cada turno con nombre/duración/precio
      const serviciosById = new Map(servicios.map(s => [s.id, s]));
      const turnosEnriquecidos = misTurnos.map(t => {
        const s = serviciosById.get(t.servicio_id) || {};
        return {
          ...t,
          servicio: { id: s.id, nombre: s.nombre, duracion: s.duracion, precio: s.precio },
        };
      });

      setEvents(turnosEnriquecidos);

      if (!formAdd.servicioId && servicios.length > 0) {
        setFormAdd((prev) => ({ ...prev, servicioId: servicios[0].id }));
      }
    } catch (err) {
      console.error("Error cargando mis servicios/turnos:", err);
    }
  }, [user?.id, formAdd.servicioId]);

  useEffect(() => {
    refreshAllMine();
  }, [refreshAllMine]);

  // =========================
  // Normalizar eventos
  // =========================
  const normalizeEvent = (raw) => {
    const start = raw.fecha_hora_inicio
      ? moment.utc(raw.fecha_hora_inicio).local().toDate()
      : new Date();
    const duracion = raw.duracion_minutos || raw.servicio?.duracion || 30;
    const end = new Date(start.getTime() + duracion * 60 * 1000);
    return { ...raw, start, end };
  };

  const turnosForCalendar = useMemo(() => {
    return events.map((e) => {
      const ne = normalizeEvent(e);
      return {
        ...ne,
        title: `${ne.servicio?.nombre || "Servicio"}${ne.cliente ? " — " + ne.cliente : ""}`,
      };
    });
  }, [events]);

  // =========================
  // CRUD Turnos
  // =========================
  const addTurno = async ({ servicioId, startISO }) => {
    const serv = services.find((s) => s.id === Number(servicioId));
    if (!serv) throw new Error("Servicio inválido");
    const start = new Date(startISO);

    const res = await api.post("/turnos/", {
      servicio_id: Number(serv.id),
      fecha_hora_inicio: start.toISOString(),
      duracion_minutos: serv.duracion || 30,
      capacidad: 1,
      precio: serv.precio || 0,
    });

    const nuevoTurno = { ...res.data, servicio: serv };
    setEvents((prev) => [...prev, nuevoTurno]);

    return res.data;
  };

  const updateTurno = async (id, payload) => {
    const res = await api.put(`/turnos/${id}`, payload);
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...res.data } : e)));
    return res.data;
  };

  const deleteTurno = async (id) => {
    await api.delete(`/turnos/${id}`);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    return true;
  };

  return {
    services,
    events,
    turnosForCalendar,
    refreshAllMine,
    addTurno,
    updateTurno,
    deleteTurno,
    normalizeEvent,
    formAdd,
    setFormAdd,
  };
};
