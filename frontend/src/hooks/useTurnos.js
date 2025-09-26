import { useState, useEffect, useMemo, useContext } from "react";
import api from "../components/api"; // instancia con interceptor JWT
import { UserContext } from "../context/UserContext";
import moment from "moment"; // al inicio del archivo

export const useTurnos = () => {
  const { user } = useContext(UserContext); // ⚠️ Usuario logueado
  const [services, setServices] = useState([]);
  const [events, setEvents] = useState([]);
  const [formAdd, setFormAdd] = useState({ servicioId: null });

  // =========================
  // Cargar servicios + turnos desde el endpoint unificado
  // =========================
  const refreshServicesYTurnos = async () => {
    try {
      if (!user?.id) return;
      const res = await api.get(`/emprendedores/${user.id}/servicios`);
      const servicios = res.data || [];

      setServices(servicios);

      // 🔹 Flatten de los turnos de cada servicio en events
      const turnos = servicios.flatMap((s) =>
        (s.turnos || []).map((t) => ({
          ...t,
          servicio: { id: s.id, nombre: s.nombre, duracion: s.duracion, precio: s.precio },
        }))
      );
      setEvents(turnos);

      // Setear servicio default si no hay
      if (!formAdd.servicioId && servicios.length > 0) {
        setFormAdd((prev) => ({ ...prev, servicioId: servicios[0].id }));
      }
    } catch (err) {
      console.error("Error cargando servicios y turnos:", err);
    }
  };

  useEffect(() => {
    refreshServicesYTurnos();
  }, [user?.id]);

  // =========================
  // Normalizar eventos para calendario
  // =========================
  

// =========================
// Normalizar eventos para calendario
// =========================
const normalizeEvent = (raw) => {
  // Convertimos la fecha UTC a hora local
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
        title: `${ne.servicio?.nombre || "Servicio"}${
          ne.cliente ? " — " + ne.cliente : ""
        }`,
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

    // 🔹 Agregar turno al servicio y a la lista
    const nuevoTurno = { ...res.data, servicio: serv };
    setEvents((prev) => [...prev, nuevoTurno]);

    return res.data;
  };

  const updateTurno = async (id, payload) => {
    const res = await api.put(`/turnos/${id}`, payload);
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...res.data } : e))
    );
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
    refreshServicesYTurnos,
    addTurno,
    updateTurno,
    deleteTurno,
    normalizeEvent,
    formAdd,
    setFormAdd,
  };
};
