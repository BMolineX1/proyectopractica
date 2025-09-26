import { useState, useEffect } from "react";
import api from "../components/api";
import Modal from "./Modal";

export default function HoursModal({ hours, onClose, refreshHours }) {
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
    setLocalHours(hours);
  }, [hours]);

  const handleChange = (day, field, value) => {
    setLocalHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = async () => {
  try {
    const payload = Object.keys(localHours).map((dayKey) => {
      const day = dias[dayKey]; // transforma "monday" -> "Lunes"
      const from = localHours[dayKey]?.from || null;
      const to = localHours[dayKey]?.to || null;

      return {
        dia_semana: day,
        hora_inicio: from,
        hora_fin: to,
      };
    });

    await api.put(`/horarios/emprendimiento/${emprendimientoId}`, payload);
    refreshHours();
    onClose();
  } catch (error) {
    console.error("Error al guardar horarios:", error);
    alert("Error al guardar horarios");
  }
};

  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-semibold mb-3">Horarios semanales</h3>
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {Object.keys(dias).map((key) => (
          <div key={key} className="flex justify-between items-center">
            <span className="w-24">{dias[key]}</span>
            {localHours[key]?.from === "closed" ? (
              <span className="text-gray-500">Cerrado</span>
            ) : (
              <div className="flex gap-2">
                <input
                  type="time"
                  className="border p-1 rounded"
                  value={localHours[key]?.from || "09:00"}
                  onChange={(e) => handleChange(key, "from", e.target.value)}
                />
                <span>-</span>
                <input
                  type="time"
                  className="border p-1 rounded"
                  value={localHours[key]?.to || "18:00"}
                  onChange={(e) => handleChange(key, "to", e.target.value)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-3 gap-2">
        <button
          className="px-3 py-1 rounded bg-gray-200 text-gray-800"
          onClick={onClose}
        >
          Cerrar
        </button>
        <button
          className="px-3 py-1 rounded bg-blue-600 text-white"
          onClick={handleSave}
        >
          Guardar
        </button>
      </div>
    </Modal>
  );
}
