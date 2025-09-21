// src/pages/Turnos.jsx
import React, { useState, useMemo } from "react";
import Calendario from "../components/Calendario";
import moment from "moment";
import api from "../components/api";
export default function Turnos() {
  // -------------------- Estados --------------------
  const [rol, setRol] = useState("emprendedor"); // "cliente" o "emprendedor"
  
  const [events, setEvents] = useState([
    {
      id: 1,
      servicio: "Corte",
      cliente: "Juan Pérez",
      start: new Date().toISOString().slice(0, 16),
      end: new Date(new Date().getTime() + 30 * 60 * 1000).toISOString().slice(0, 16),
    },
    {
      id: 2,
      servicio: "Tintura",
      cliente: "Ana López",
      start: moment().add(1, "day").hour(11).minute(0).toDate(),
      end: moment().add(1, "day").hour(12).minute(30).toDate(),
    },
  ]);

  const [services, setServices] = useState([
    { id: "s1", name: "Corte", duration: 30 },
    { id: "s2", name: "Tintura", duration: 90 },
  ]);

  const [hours, setHours] = useState({
    monday: { from: "09:00", to: "18:00" },
    tuesday: { from: "09:00", to: "18:00" },
    wednesday: { from: "09:00", to: "18:00" },
    thursday: { from: "09:00", to: "18:00" },
    friday: { from: "09:00", to: "18:00" },
    saturday: { from: "09:00", to: "13:00" },
    sunday: { from: "closed", to: "closed" },
  });

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [slotToAdd, setSlotToAdd] = useState(null);
  const [formAdd, setFormAdd] = useState({
    servicioId: services[0]?.id || "",
    cliente: "",
    startISO: "",
  });

  // -------------------- Funciones --------------------
  const normalizeEvent = (raw) => {
    const start = typeof raw.start === "string" ? new Date(raw.start) : raw.start;
    const end = typeof raw.end === "string" ? new Date(raw.end) : raw.end;
    return { ...raw, start, end };
  };

  const turnosForCalendar = useMemo(() => {
    return events.map((e) => {
      const ne = normalizeEvent(e);
      return { ...ne, title: `${ne.servicio}${ne.cliente ? " — " + ne.cliente : ""}` };
    });
  }, [events]);

  const onSelectSlot = (slotInfo) => {
    if (rol !== "emprendedor") return; // solo emprendedor puede agregar
    setSlotToAdd({ start: slotInfo.start, end: slotInfo.end });
    setFormAdd({
      servicioId: services[0]?.id || "",
      cliente: "",
      startISO: moment(slotInfo.start).format("YYYY-MM-DDTHH:mm"),
    });
    setShowAddModal(true);
  };

  const onSelectEvent = (evt) => {
    if (rol === "emprendedor") setShowEditModal(true);
    setSelectedEvent(evt);
  };

  const handleAddTurno = () => {
    const serv = services.find((s) => s.id === formAdd.servicioId);
    if (!serv) return alert("Seleccione servicio válido.");
    if (!formAdd.startISO) return alert("Seleccione fecha/hora de inicio.");
    const start = new Date(formAdd.startISO);
    const end = new Date(start.getTime() + serv.duration * 60 * 1000);
    const nuevo = {
      id: Date.now(),
      servicio: serv.name,
      cliente: formAdd.cliente || "Cliente",
      start,
      end,
      color: "#1976d2",
    };
    setEvents((prev) => [...prev, nuevo]);
    setShowAddModal(false);
    setFormAdd({ servicioId: services[0]?.id || "", cliente: "", startISO: "" });
  };

  const handleEditTurno = (changes) => {
    if (!selectedEvent) return;
    setEvents((prev) =>
      prev.map((e) => (e.id === selectedEvent.id ? { ...e, ...changes } : e))
    );
    setShowEditModal(false);
    setSelectedEvent(null);
  };

  const handleDeleteTurno = () => {
    if (!selectedEvent) return;
    if (!confirm("¿Eliminar este turno?")) return;
    setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
    setShowEditModal(false);
    setSelectedEvent(null);
  };

  const addService = (name, duration) => {
    const newS = { id: "s" + Date.now(), name, duration: Number(duration) || 30 };
    setServices((prev) => [...prev, newS]);
  };
  const updateService = (id, payload) =>
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...payload } : s)));
  const deleteService = (id) => setServices((prev) => prev.filter((s) => s.id !== id));

  const handleHourChange = (dayKey, field, value) => {
    setHours((prev) => ({ ...prev, [dayKey]: { ...prev[dayKey], [field]: value } }));
  };

  const todayKey = moment().format("YYYY-MM-DD");
  const turnosHoy = events.filter((e) => {
    const start = normalizeEvent(e).start;
    return moment(start).format("YYYY-MM-DD") === todayKey;
  });

  const generarLinkTurno = () => {
    const token = btoa(Date.now().toString()); // token simple
    const url = `${window.location.origin}/reserva/${token}`;
    navigator.clipboard.writeText(url);
    alert(`Link copiado al portapapeles:\n${url}`);
  };

  // -------------------- Render --------------------
  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-5 p-5 font-inter">
      {/* Header */}
      <header className="md:col-span-2 flex justify-between items-center mb-2">
        <div>
          <h1 className="text-xl text-gray-800">Turnera — Gestión de Turnos</h1>
          <p className="text-gray-500 text-sm">Configuración de calendario.</p>
        </div>
        {rol === "emprendedor" && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowServicesModal(true)}
              className="px-3 py-1 text-sm rounded bg-gray-200 text-gray-800"
            >
              🧾 Servicios
            </button>
            <button
              onClick={() => setShowHoursModal(true)}
              className="px-3 py-1 text-sm rounded bg-gray-200 text-gray-800"
            >
              🕒 Horarios
            </button>
            <button
              onClick={generarLinkTurno}
              className="px-3 py-1 text-sm rounded bg-green-600 text-white"
            >
              🔗 Generar link turno
            </button>
          </div>
        )}
      </header>

      {/* Calendario */}
      <main className="bg-white p-4 rounded-xl shadow-md">
        <Calendario
          turnos={turnosForCalendar}
          onSelectEvent={onSelectEvent}
          onSelectSlot={onSelectSlot}
          defaultView="week"
        />
      </main>

      {/* Sidebar solo para emprendedor */}
      {rol === "emprendedor" && (
        <aside className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-md flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Acciones rápidas</h3>
            <p className="text-gray-500 text-xs">
              Seleccioná un turno en el calendario para editar o cancelar.
            </p>
            <div className="flex flex-col gap-2">
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
                onClick={() => setShowAddModal(true)}
              >
                ➕ Agregar turno
              </button>
              <button
                className="px-3 py-1 rounded bg-yellow-500 text-gray-800 text-sm"
                onClick={() => {
                  if (!selectedEvent) return alert("Seleccione un turno en el calendario.");
                  setShowEditModal(true);
                }}
              >
                ✏️ Editar / Posponer
              </button>
              <button
                className="px-3 py-1 rounded bg-red-600 text-white text-sm"
                onClick={() => {
                  if (!selectedEvent) return alert("Seleccione un turno en el calendario.");
                  handleDeleteTurno();
                }}
              >
                ❌ Cancelar
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md">
            <h3 className="text-sm font-semibold">Turnos hoy ({moment().format("DD/MM/YYYY")})</h3>
            {turnosHoy.length === 0 ? (
              <p className="text-gray-500 text-xs">No hay turnos para hoy</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {turnosHoy.map((t) => {
                  const ne = normalizeEvent(t);
                  return (
                    <li
                      key={t.id}
                      className="flex gap-2 p-2 rounded bg-gray-50 cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setSelectedEvent(t);
                        setShowEditModal(true);
                      }}
                    >
                      <div className="w-16 font-semibold text-gray-800">
                        {moment(ne.start).format("HH:mm")} - {moment(ne.end).format("HH:mm")}
                      </div>
                      <div className="flex flex-col">
                        <div className="font-semibold text-gray-800">{t.servicio}</div>
                        <div className="text-gray-500 text-sm">{t.cliente}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md space-y-2 text-sm">
            <h3 className="font-semibold">Servicios</h3>
            <ul className="divide-y divide-gray-100">
              {services.map((s) => (
                <li key={s.id} className="flex justify-between py-1">
                  {s.name} — {s.duration} min
                </li>
              ))}
            </ul>
            <button
              className="px-3 py-1 rounded bg-gray-200 text-gray-800 text-sm"
              onClick={() => setShowServicesModal(true)}
            >
              Gestionar servicios
            </button>
          </div>
        </aside>
      )}

      {/* Modales internos */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <h3 className="text-lg font-semibold mb-2">Agregar turno</h3>
          <label className="text-sm text-gray-700">Servicio</label>
          <select
            className="w-full border rounded p-2 mb-2"
            value={formAdd.servicioId}
            onChange={(e) => setFormAdd({ ...formAdd, servicioId: e.target.value })}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.duration} min
              </option>
            ))}
          </select>
          <label className="text-sm text-gray-700">Cliente (opcional)</label>
          <input
            className="w-full border rounded p-2 mb-2"
            placeholder="Nombre del cliente"
            value={formAdd.cliente}
            onChange={(e) => setFormAdd({ ...formAdd, cliente: e.target.value })}
          />
          <label className="text-sm text-gray-700">Inicio</label>
          <input
            type="datetime-local"
            className="w-full border rounded p-2 mb-2"
            value={formAdd.startISO}
            onChange={(e) => setFormAdd({ ...formAdd, startISO: e.target.value })}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={handleAddTurno}>
              Guardar
            </button>
            <button
              className="px-3 py-1 rounded bg-gray-200 text-gray-800"
              onClick={() => setShowAddModal(false)}
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {showEditModal && selectedEvent && (
        <Modal onClose={() => setShowEditModal(false)}>
          <h3 className="text-lg font-semibold mb-2">Editar turno</h3>
          <p className="text-gray-500 mb-2">Servicio: {selectedEvent.servicio}</p>
          <label className="text-sm text-gray-700">Cliente</label>
          <input
            className="w-full border rounded p-2 mb-2"
            defaultValue={selectedEvent.cliente}
            onChange={(e) =>
              setSelectedEvent((prev) => ({ ...prev, cliente: e.target.value }))
            }
          />
          <label className="text-sm text-gray-700">Inicio</label>
          <input
            type="datetime-local"
            className="w-full border rounded p-2 mb-2"
            defaultValue={moment(selectedEvent.start).format("YYYY-MM-DDTHH:mm")}
            onChange={(e) =>
              setSelectedEvent((prev) => ({ ...prev, start: new Date(e.target.value) }))
            }
          />
          <label className="text-sm text-gray-700">Fin</label>
          <input
            type="datetime-local"
            className="w-full border rounded p-2 mb-2"
            defaultValue={moment(selectedEvent.end).format("YYYY-MM-DDTHH:mm")}
            onChange={(e) =>
              setSelectedEvent((prev) => ({ ...prev, end: new Date(e.target.value) }))
            }
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              className="px-3 py-1 rounded bg-blue-600 text-white"
              onClick={() =>
                handleEditTurno({
                  cliente: selectedEvent.cliente,
                  start: selectedEvent.start,
                  end: selectedEvent.end,
                })
              }
            >
              Guardar cambios
            </button>
            <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={handleDeleteTurno}>
              Eliminar turno
            </button>
            <button
              className="px-3 py-1 rounded bg-gray-200 text-gray-800"
              onClick={() => setShowEditModal(false)}
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}

      {showServicesModal && (
        <ServicesModal
          services={services}
          onClose={() => setShowServicesModal(false)}
          onAdd={(name, duration) => addService(name, duration)}
          onUpdate={(id, payload) => updateService(id, payload)}
          onDelete={(id) => deleteService(id)}
        />
      )}

      {showHoursModal && (
        <HoursModal
          hours={hours}
          onClose={() => setShowHoursModal(false)}
          onChange={(dayKey, field, value) => handleHourChange(dayKey, field, value)}
        />
      )}
    </div>
  );
}

/* Modal base */
function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
      onMouseDown={onClose}
    >
      <div
        className="bg-white p-4 rounded-xl shadow-lg w-[400px]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ServicesModal */
function ServicesModal({ services, onClose, onAdd, onUpdate, onDelete }) {
  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState(30);

  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-semibold mb-2">Gestionar servicios</h3>
      <ul className="divide-y divide-gray-100 mb-3">
        {services.map((s) => (
          <li key={s.id} className="flex justify-between items-center py-2">
            <span>
              {s.name} — {s.duration} min
            </span>
            <button
              className="text-red-600 text-sm"
              onClick={() => onDelete(s.id)}
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2 mb-3">
        <input
          className="border rounded p-2 flex-1"
          placeholder="Nuevo servicio"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          type="number"
          className="border rounded p-2 w-20"
          value={newDuration}
          onChange={(e) => setNewDuration(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded"
          onClick={() => {
            if (!newName) return;
            onAdd(newName, newDuration);
            setNewName("");
            setNewDuration(30);
          }}
        >
          Agregar
        </button>
        <button
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}

/* HoursModal */
function HoursModal({ hours, onClose, onChange }) {
  const days = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
  };

  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-semibold mb-2">Configurar horarios</h3>
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {Object.keys(days).map((day) => (
          <div key={day} className="flex items-center gap-2 text-sm">
            <span className="w-24">{days[day]}</span>
            {hours[day].from === "closed" ? (
              <span className="text-gray-500">Cerrado</span>
            ) : (
              <>
                <input
                  type="time"
                  className="border rounded p-1"
                  value={hours[day].from}
                  onChange={(e) => onChange(day, "from", e.target.value)}
                />
                <span>-</span>
                <input
                  type="time"
                  className="border rounded p-1"
                  value={hours[day].to}
                  onChange={(e) => onChange(day, "to", e.target.value)}
                />
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
