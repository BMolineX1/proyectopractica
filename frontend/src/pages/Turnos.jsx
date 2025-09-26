import React, { useState, useEffect, useContext } from "react";
import moment from "moment";
import Calendario from "../hooks/Calendario";
import ServicesModal from "../hooks/ServicesModal";
import HoursModal from "../hooks/HoursModal";
import Modal from "../hooks/Modal";
import { useTurnos } from "../hooks/useTurnos";
import { UserContext } from "../context/UserContext";
import api from "../components/api";

export default function Turnos() {
  const { user } = useContext(UserContext);
  console.log("USER:", user);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [slotToAdd, setSlotToAdd] = useState(null);
  const [formAdd, setFormAdd] = useState({ servicioId: "", cliente: "", startISO: "" });
  const [hours, setHours] = useState({
    monday: [{ from: "09:00", to: "18:00" }],
    tuesday: [{ from: "09:00", to: "18:00" }],
    wednesday: [{ from: "09:00", to: "18:00" }],
    thursday: [{ from: "09:00", to: "18:00" }],
    friday: [{ from: "09:00", to: "18:00" }],
    saturday: [{ from: "09:00", to: "13:00" }],
    sunday: [],
  });

  const {
    services,
    events,
    turnosForCalendar,
    addTurno,
    updateTurno,
    deleteTurno,
    normalizeEvent,
    refreshServices,
  } = useTurnos();

  // ==============================
  // Cargar horarios desde backend
  // ==============================
  const fetchHours = async () => {
    if (!user?.emprendimiento_id) return;
    try {
      const res = await api.get(`/horarios/${user.emprendimiento_id}`);
      const data = res.data;
      // Transformar a formato de HoursModal
      const newHours = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      };
      data.forEach((h) => {
        newHours[h.dia_semana] = [{ from: h.hora_inicio, to: h.hora_fin }];
      });
      setHours(newHours);
    } catch (err) {
      console.error("Error cargando horarios:", err);
    }
  };

  useEffect(() => {
    fetchHours();
  }, [user]);

  // ==============================
  // Selección de slot y evento
  // ==============================
  const onSelectSlot = (slotInfo) => {
    const dayKey = moment(slotInfo.start).format("dddd").toLowerCase();
    const bloques = hours[dayKey] || [];
    const timeStr = moment(slotInfo.start).format("HH:mm");
    const isValid = bloques.some((b) => timeStr >= b.from && timeStr < b.to);
    if (!isValid) return alert("Horario fuera de los bloques definidos.");

    setSlotToAdd({ start: slotInfo.start, end: slotInfo.end });
    setFormAdd({
      servicioId: services[0]?.id || "",
      cliente: "",
      startISO: moment(slotInfo.start).format("YYYY-MM-DDTHH:mm"),
    });
    setShowAddModal(true);
  };

  const onSelectEvent = (evt) => {
    setSelectedEvent(evt);
    setShowEditModal(true);
  };

  // ==============================
  // Agregar turno
  // ==============================
  const handleAddTurno = async () => {
    try {
      await addTurno({
        servicioId: formAdd.servicioId,
        startISO: formAdd.startISO,
      });
      setShowAddModal(false);
      setFormAdd({ servicioId: services[0]?.id || "", cliente: "", startISO: "" });
    } catch (err) {
      console.error("Error agregando turno:", err);
      alert("No se pudo agregar el turno. Revisa consola para detalles.");
    }
  };

  // ==============================
  // Editar turno
  // ==============================
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

  const turnosHoy = events.filter((e) => {
    const start = normalizeEvent(e).start;
    return moment(start).format("YYYY-MM-DD") === moment().format("YYYY-MM-DD");
  });

  const generarLinkTurno = () => {
    const token = btoa(Date.now().toString());
    const url = `${window.location.origin}/reserva/${token}`;
    navigator.clipboard.writeText(url);
    alert(`Link copiado al portapapeles:\n${url}`);
  };

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-5 p-5 font-inter">
      {/* Header */}
      <header className="md:col-span-2 flex justify-between items-center mb-2">
        <div>
          <h1 className="text-xl text-gray-800">Turnera — Gestión de Turnos</h1>
          <p className="text-gray-500 text-sm">Configuración de calendario.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowServicesModal(true)} className="px-3 py-1 text-sm rounded bg-gray-200 text-gray-800">🧾 Servicios</button>

          {/* Botón horarios solo para emprendedores */}
          {user?.emprendimiento_id && (
            <button
              onClick={() => setShowHoursModal(true)}
              className="px-3 py-1 text-sm rounded bg-gray-200 text-gray-800"
            >
              🕒 Horarios
            </button>
          )}

          <button onClick={generarLinkTurno} className="px-3 py-1 text-sm rounded bg-green-600 text-white">🔗 Generar link turno</button>
        </div>
      </header>

      {/* Calendario */}
      <main className="bg-white p-4 rounded-xl shadow-md">
        <Calendario turnos={turnosForCalendar} onSelectEvent={onSelectEvent} onSelectSlot={onSelectSlot} defaultView="week"/>
      </main>

      {/* Sidebar */}
      <aside className="space-y-4">
        <div className="bg-white p-4 rounded-xl shadow-md flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Acciones rápidas</h3>
          <p className="text-gray-500 text-xs">Seleccioná un turno en el calendario para editar o cancelar.</p>
          <div className="flex flex-col gap-2">
            <button className="px-3 py-1 rounded bg-blue-600 text-white text-sm" onClick={() => setShowAddModal(true)}>➕ Agregar turno</button>
            <button className="px-3 py-1 rounded bg-yellow-500 text-gray-800 text-sm" onClick={() => { if (!selectedEvent) return alert("Seleccione un turno en el calendario."); setShowEditModal(true); }}>✏️ Editar / Posponer</button>
            <button className="px-3 py-1 rounded bg-red-600 text-white text-sm" onClick={handleDeleteTurno}>❌ Cancelar</button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md">
          <h3 className="text-sm font-semibold">Turnos hoy ({moment().format("DD/MM/YYYY")})</h3>
          {turnosHoy.length === 0 ? <p className="text-gray-500 text-xs">No hay turnos para hoy</p> : (
            <ul className="divide-y divide-gray-100">
              {turnosHoy.map((t) => {
                const ne = normalizeEvent(t);
                return (
                  <li key={t.id} className="flex gap-2 p-2 rounded bg-gray-50 cursor-pointer hover:bg-gray-100" onClick={() => { setSelectedEvent(t); setShowEditModal(true); }}>
                    <div className="w-16 font-semibold text-gray-800">{moment(ne.start).format("HH:mm")} - {moment(ne.end).format("HH:mm")}</div>
                    <div className="flex flex-col">
                      <div className="font-semibold text-gray-800">{t.servicio?.nombre}</div>
                      <div className="text-gray-500 text-sm">{t.cliente}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Modales */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <h3 className="text-lg font-semibold mb-2">Agregar turno</h3>
          <label className="text-sm text-gray-700">Servicio</label>
          <select className="w-full border rounded p-2 mb-2" value={formAdd.servicioId} onChange={(e) => setFormAdd({ ...formAdd, servicioId: e.target.value })}>
            {services.map(s => <option key={s.id} value={s.id}>{s.nombre} — {s.duracion} min</option>)}
          </select>
          <label className="text-sm text-gray-700">Cliente (opcional)</label>
          <input className="w-full border rounded p-2 mb-2" placeholder="Nombre del cliente" value={formAdd.cliente} onChange={(e) => setFormAdd({ ...formAdd, cliente: e.target.value })}/>
          <label className="text-sm text-gray-700">Fecha y hora inicio</label>
          <input type="datetime-local" className="w-full border rounded p-2 mb-2" value={formAdd.startISO} onChange={(e) => setFormAdd({ ...formAdd, startISO: e.target.value })}/>
          <button onClick={handleAddTurno} className="w-full py-2 bg-green-600 text-white rounded">Agregar turno</button>
        </Modal>
      )}

      {showEditModal && selectedEvent && (
        <Modal onClose={() => setShowEditModal(false)}>
          <h3 className="text-lg font-semibold mb-2">Editar turno</h3>
          <label className="text-sm text-gray-700">Cliente</label>
          <input className="w-full border rounded p-2 mb-2" value={selectedEvent.cliente || ""} onChange={(e) => setSelectedEvent({ ...selectedEvent, cliente: e.target.value })}/>
          <div className="flex gap-2">
            <button onClick={handleEditTurno} className="flex-1 py-2 bg-yellow-500 text-white rounded">Guardar cambios</button>
            <button onClick={handleDeleteTurno} className="flex-1 py-2 bg-red-600 text-white rounded">Cancelar turno</button>
          </div>
        </Modal>
      )}

      {showServicesModal && <ServicesModal emprendedorId={user?.id} services={services} onClose={() => setShowServicesModal(false)} refreshServices={refreshServices}/>}

      {showHoursModal && (
        <HoursModal
          hours={hours}
          emprendimientoId={user?.emprendimiento_id}
          onClose={() => setShowHoursModal(false)}
          refreshHours={fetchHours}
        />
      )}
    </div>
  );
}
