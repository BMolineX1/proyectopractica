import React, { useState, useEffect, useContext } from "react";
import Modal from "./Modal";
import api from "../components/api";
import { UserContext } from "../context/UserContext";

export default function ServicesModal({ emprendedorId, onClose, onServiceAdded }) {
  const [services, setServices] = useState([]);
  const [nombre, setNombre] = useState("");
  const [duracion, setDuracion] = useState("");
  const [precio, setPrecio] = useState("");
  const [editingId, setEditingId] = useState(null); // id del servicio que se está editando
  const { user } = useContext(UserContext);

  // Cargar servicios del backend
  const loadServices = async () => {
    try {
      if (!emprendedorId) return;
      const res = await api.get(`/emprendedores/${emprendedorId}/servicios`);
      setServices(res.data);
    } catch (err) {
      console.error("Error cargando servicios:", err.response?.data || err);
    }
  };

  useEffect(() => {
    loadServices();
  }, [emprendedorId]);

  // Limpiar inputs
  const resetForm = () => {
    setNombre("");
    setDuracion("");
    setPrecio("");
    setEditingId(null);
  };

  // Crear o actualizar servicio
  const handleSubmit = async () => {
    if (!nombre || !duracion) {
      return alert("Complete nombre y duración del servicio");
    }
    if (!emprendedorId) {
      console.error("No se tiene emprendedorId.");
      return alert("Error: no se pudo identificar el emprendedor.");
    }

    const payload = {
      nombre,
      duracion: Number(duracion),
      precio: Number(precio) || 0,
      emprendedor_id: Number(emprendedorId),
    };

    try {
      if (editingId) {
        // Actualizar
        const res = await api.put(`/servicios/${editingId}`, payload);
        console.log("Servicio actualizado:", res.data);
      } else {
        // Crear
        const res = await api.post("/servicios/", payload);
        console.log("Servicio creado:", res.data);
      }

      resetForm();
      loadServices();
      if (typeof onServiceAdded === "function") onServiceAdded();
    } catch (err) {
      console.error("Error guardando servicio:", err.response?.data || err);
      alert(`Error del servidor: ${JSON.stringify(err.response?.data || err)}`);
    }
  };

  // Eliminar servicio
  const handleDelete = async (id) => {
    if (!confirm("¿Seguro que quieres eliminar este servicio?")) return;
    try {
      await api.delete(`/servicios/${id}`);
      loadServices();
    } catch (err) {
      console.error("Error eliminando servicio:", err.response?.data || err);
      alert("No se pudo eliminar el servicio.");
    }
  };

  // Cargar servicio en inputs para editar
  const handleEdit = (s) => {
    setNombre(s.nombre);
    setDuracion(s.duracion);
    setPrecio(s.precio);
    setEditingId(s.id);
  };

  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-semibold mb-2">Servicios</h3>

      {/* Lista de servicios */}
      <ul className="mb-4 divide-y divide-gray-200 max-h-48 overflow-y-auto">
        {services.map((s) => (
          <li key={s.id} className="py-1 flex justify-between items-center">
            <span>{s.nombre} — {s.duracion} min — ${s.precio}</span>
            <div className="flex gap-2">
              <button
                className="px-2 py-1 bg-yellow-500 text-white rounded"
                onClick={() => handleEdit(s)}
              >
                Editar
              </button>
              <button
                className="px-2 py-1 bg-red-500 text-white rounded"
                onClick={() => handleDelete(s.id)}
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Formulario para agregar/editar */}
      <div className="flex flex-col gap-2">
        <input
          className="border rounded p-2"
          placeholder="Nombre del servicio"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          type="number"
          className="border rounded p-2"
          placeholder="Duración (minutos)"
          value={duracion}
          onChange={(e) => setDuracion(e.target.value)}
        />
        <input
          type="number"
          className="border rounded p-2"
          placeholder="Precio (opcional)"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white"
            onClick={handleSubmit}
          >
            {editingId ? "Actualizar" : "Agregar"}
          </button>
          <button
            className="px-3 py-1 rounded bg-gray-200 text-gray-800"
            onClick={() => { resetForm(); onClose(); }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
