import React, { useState, useEffect } from "react";
import api from "../components/api";
import Modal from "./Modal";

export default function HoursModal({ hours, onClose, refreshHours, emprendimientoId }) {
  const [localHours, setLocalHours] = useState({});

  const dias = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
  };

  useEffect(() => {
    // clonar para editar localmente
    setLocalHours(hours || {
      monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [],
    });
  }, [hours]);

  const handleChange = (day, index, field, value) => {
    setLocalHours((prev) => {
      const arr = [...(prev[day] || [])];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [day]: arr };
    });
  };

  const addBlock = (day) => {
    setLocalHours((prev) => {
      const arr = [...(prev[day] || [])];
      arr.push({ from: "09:00", to: "18:00" });
      return { ...prev, [day]: arr };
    });
  };

  const removeBlock = (day, index) => {
    setLocalHours((prev) => {
      const arr = [...(prev[day] || [])];
      arr.splice(index, 1);
      return { ...prev, [day]: arr };
    });
  };

  const handleSave = async () => {
    try {
      if (!emprendimientoId) {
  alert("Aún no se detectó tu emprendimiento. Cerrá y reintentá en unos segundos.");
  return;
}
      // armamos payload: [{dia_semana, hora_inicio, hora_fin}]
      const payload = [];
      Object.keys(localHours).forEach((dayKey) => {
        const day = dias[dayKey];
        const bloques = localHours[dayKey] || [];
        bloques.forEach((b) => {
          if (b.from && b.to) {
            payload.push({
              dia_semana: day,
              hora_inicio: b.from,
              hora_fin: b.to,
            });
          }
        });
      });

      await api.put(`/emprendedores/${emprendimientoId}/horarios:replace`, payload);
      refreshHours?.();
      onClose();
    } catch (error) {
      console.error("Error al guardar horarios:", error);
      alert("Error al guardar horarios");
    }
  };

  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-semibold mb-3">Horarios semanales</h3>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {Object.keys(dias).map((key) => (
          <div key={key} className="border rounded p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{dias[key]}</span>
              <button className="text-sm bg-gray-200 px-2 py-1 rounded" onClick={() => addBlock(key)}>
                + Agregar bloque
              </button>
            </div>

            {(localHours[key] || []).length === 0 ? (
              <p className="text-gray-500 text-sm">Sin bloques — agregá uno.</p>
            ) : (
              (localHours[key] || []).map((b, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <input
                    type="time"
                    className="border p-1 rounded"
                    value={b.from || "09:00"}
                    onChange={(e) => handleChange(key, idx, "from", e.target.value)}
                  />
                  <span>-</span>
                  <input
                    type="time"
                    className="border p-1 rounded"
                    value={b.to || "18:00"}
                    onChange={(e) => handleChange(key, idx, "to", e.target.value)}
                  />
                  <button className="ml-auto text-sm bg-red-100 text-red-700 px-2 py-1 rounded"
                          onClick={() => removeBlock(key, idx)}>
                    Quitar
                  </button>
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-3 gap-2">
        <button className="px-3 py-1 rounded bg-gray-200 text-gray-800" onClick={onClose}>
          Cerrar
        </button>
        <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={handleSave}>
          Guardar
        </button>
      </div>
    </Modal>
  );
}
