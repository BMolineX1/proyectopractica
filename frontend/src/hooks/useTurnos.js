import { useState, useEffect, useMemo, useContext, useCallback } from "react";
import api from "../components/api";
import { UserContext } from "../context/UserContext";
import moment from "moment";

export const useTurnos = () => {
  const { user } = useContext(UserContext);
  const [services, setServices] = useState([]);
  const [events, setEvents] = useState([]);
  const [formAdd, setFormAdd] = useState({ servicioId: null });

  // =========================
  // Rutas helpers (intenta varias variantes por compatibilidad de backend)
  // =========================
  const fetchServiciosForOwner = async (ownerId) => {
    const tryPaths = [
      `/servicios?emprendedor_id=${ownerId}`,
      `/servicios/emprendedor/${ownerId}`,
      `/emprendedores/${ownerId}/servicios`,
    ];
    for (const path of tryPaths) {
      try {
        const r = await api.get(path);
        if (Array.isArray(r.data)) return r.data;
      } catch (_) {}
    }
    return [];
  };

  const fetchTurnosForOwner = async (ownerId) => {
    const tryPaths = [
      `/turnos?emprendedor_id=${ownerId}`,
      `/turnos/emprendedor/${ownerId}`,
      `/emprendedores/${ownerId}/turnos`,
    ];
    for (const path of tryPaths) {
      try {
        const r = await api.get(path);
        if (Array.isArray(r.data)) return r.data;
      } catch (_) {}
    }
    return [];
  };

  // =========================
  // Mis servicios + mis turnos (para el dueño)
  // =========================
  const refreshAllMine = useCallback(async () => {
    try {
      if (!user?.id) return;
      const servRes = await api.get("/servicios/mis-servicios");
      const servicios = servRes.data || [];
      setServices(servicios);

      const turnRes = await api.get("/turnos/mis-turnos");
      const misTurnos = turnRes.data || [];

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
  // Público: servicios + turnos por dueño (cliente visitante)
  // =========================
  const refreshPublicByOwnerId = useCallback(
    async (ownerId) => {
      if (!ownerId) return;
      try {
        const [servicios, turnos] = await Promise.all([
          fetchServiciosForOwner(ownerId),
          fetchTurnosForOwner(ownerId),
        ]);
        setServices(servicios);

        const serviciosById = new Map(servicios.map(s => [s.id, s]));
        const enriquecidos = (turnos || []).map(t => {
          const s = serviciosById.get(t.servicio_id) || {};
          return {
            ...t,
            servicio: { id: s.id, nombre: s.nombre, duracion: s.duracion, precio: s.precio },
          };
        });
        setEvents(enriquecidos);

        if (!formAdd.servicioId && servicios.length > 0) {
          setFormAdd((prev) => ({ ...prev, servicioId: servicios[0].id }));
        }
      } catch (err) {
        console.error("Error cargando turnos/servicios públicos:", err);
      }
    },
    [formAdd.servicioId]
  );

  // =========================
  // Normalizar eventos (ojo zona horaria)
  // =========================
  const normalizeEvent = (raw) => {
    const start = raw.fecha_hora_inicio
      ? moment.parseZone(raw.fecha_hora_inicio).toDate()   // <= clave para no correr horario
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
  // CRUD Turnos (dueño)
  // =========================
  const addTurno = async ({ servicioId, startISO, cliente }) => {
    const serv = services.find((s) => s.id === Number(servicioId));
    if (!serv) throw new Error("Servicio inválido");
    const start = new Date(startISO);

    const res = await api.post("/turnos/", {
      servicio_id: Number(serv.id),
      fecha_hora_inicio: start.toISOString(),
      duracion_minutos: serv.duracion || 30,
      capacidad: 1,
      precio: serv.precio || 0,
      ...(cliente ? { cliente } : {}),
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
  const refreshServices = useCallback(async (ownerId) => {
  try {
    // Prioridad: si me pasan ownerId, traigo “por emprendedor”
    if (ownerId) {
      const servicios = await fetchServiciosForOwner(ownerId);
      setServices(servicios);
      // si no hay servicio seleccionado, seteo uno por defecto
      if (!formAdd.servicioId && servicios.length) {
        setFormAdd((prev) => ({ ...prev, servicioId: servicios[0].id }));
      }
      return servicios;
    }
    // Si no, intento “mis servicios” (modo dueño autenticado)
    const r = await api.get("/servicios/mis-servicios");
    const servicios = r.data || [];
    setServices(servicios);
    if (!formAdd.servicioId && servicios.length) {
      setFormAdd((prev) => ({ ...prev, servicioId: servicios[0].id }));
    }
    return servicios;
  } catch (e) {
    console.error("Error refreshServices:", e);
    return [];
  }
}, [formAdd.servicioId]);

  return {
    services,
    events,
    turnosForCalendar,
    refreshAllMine,
    refreshPublicByOwnerId,    // <= NUEVO
    addTurno,
    updateTurno,
    deleteTurno,
    normalizeEvent,
    formAdd,
    setFormAdd,
    refreshServices,
  };
};
