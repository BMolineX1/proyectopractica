import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import api from "../components/api";

export default function ServicesModal({ onClose, onServiceAdded, emprendedorId }) {
  const [services, setServices] = useState([]);
  const [nombre, setNombre] = useState("");
  const [duracion, setDuracion] = useState("");
  const [precio, setPrecio] = useState("");
  const [editingId, setEditingId] = useState(null);

  const loadBootstrap = async () => {
    try {
      const me = await api.get("/emprendedores/mi");
      const id = me.data?.id || emprendedorId;
      if (!id) throw new Error("No se encontró emprendedor para el usuario");
      const res = await api.get(`/emprendedores/${id}/servicios`);
      setServices(res.data);
    } catch (err) {
      console.error("Error cargando servicios:", err.response?.data || err);
    }
  };

  useEffect(() => { loadBootstrap(); /* eslint-disable-next-line */ }, []);

  const resetForm = () => { setNombre(""); setDuracion(""); setPrecio(""); setEditingId(null); };

  const handleSubmit = async () => {
    if (!nombre || !duracion) return alert("Completá nombre y duración");
    const payload = { nombre, duracion: Number(duracion), precio: Number(precio) || 0 };
    try {
      if (editingId) {
        await api.put(`/servicios/${editingId}`, payload);
      } else {
        await api.post("/mis/servicios", payload);
      }
      resetForm();
      await loadBootstrap();
      onServiceAdded?.();
    } catch (err) {
      console.error("Error guardando servicio:", err.response?.data || err);
      alert(`Error del servidor: ${JSON.stringify(err.response?.data || err)}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Seguro que querés eliminar este servicio?")) return;
    try {
      await api.delete(`/servicios/${id}`);
      await loadBootstrap();
    } catch (err) {
      console.error("Error eliminando servicio:", err.response?.data || err);
      alert(err.response?.data?.detail || "No se pudo eliminar el servicio.");
    }
  };

  const handleEdit = (s) => { setNombre(s.nombre); setDuracion(s.duracion); setPrecio(s.precio); setEditingId(s.id); };

  return (
    <Modal onClose={onClose}>
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 p-4 text-white mb-3">
        <h3 className="text-lg font-semibold">Servicios</h3>
        <p className="text-white/90 text-sm">Creá, editá o eliminá tus servicios.</p>
      </div>

      <ul className="mb-4 divide-y divide-gray-200 max-h-48 overflow-y-auto bg-white rounded-xl">
        {services.map((s) => (
          <li key={s.id} className="py-2 px-3 flex justify-between items-center">
            <span className="text-sm">{s.nombre} — {s.duracion} min {s.precio ? `— $${s.precio}` : ""}</span>
            <div className="flex gap-2">
              <button className="px-2 py-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl text-sm" onClick={() => handleEdit(s)}>Editar</button>
              <button className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm" onClick={() => handleDelete(s.id)}>Eliminar</button>
            </div>
          </li>
        ))}
        {services.length === 0 && <li className="py-3 px-3 text-sm text-gray-500">Sin servicios cargados.</li>}
      </ul>

      <div className="flex flex-col gap-2 bg-white p-3 rounded-xl">
        <input className="border rounded-lg p-2" placeholder="Nombre del servicio" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <input type="number" className="border rounded-lg p-2" placeholder="Duración (minutos)" value={duracion} onChange={(e) => setDuracion(e.target.value)} />
        <input type="number" className="border rounded-lg p-2" placeholder="Precio (opcional)" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        <div className="flex justify-end gap-2 mt-1">
          <button className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmit}>
            {editingId ? "Actualizar" : "Agregar"}
          </button>
          <button className="px-3 py-2 rounded-xl bg-gray-200 text-gray-800" onClick={() => { resetForm(); onClose(); }}>
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
