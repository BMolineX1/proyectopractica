import React, { useState, useEffect } from "react";
import api from "../components/api";
import Modal from "./Modal";

export default function HoursModal({
  hours,
  onClose,
  refreshHours,
  emprendimientoId,
  applyHoursToUI, // ✅ NUEVO
}) {
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

  const ensureAllDays = (obj) => ({
    monday: Array.isArray(obj?.monday) ? obj.monday : [],
    tuesday: Array.isArray(obj?.tuesday) ? obj.tuesday : [],
    wednesday: Array.isArray(obj?.wednesday) ? obj.wednesday : [],
    thursday: Array.isArray(obj?.thursday) ? obj.thursday : [],
    friday: Array.isArray(obj?.friday) ? obj.friday : [],
    saturday: Array.isArray(obj?.saturday) ? obj.saturday : [],
    sunday: Array.isArray(obj?.sunday) ? obj.sunday : [],
  });

  useEffect(() => {
    setLocalHours(ensureAllDays(hours || {}));
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
        alert("Aún no se detectó el dueño de la grilla.");
        return;
      }

      const payload = [];
      const invalids = [];
      Object.keys(dias).forEach((dayKey) => {
        const label = dias[dayKey];
        const bloques = localHours[dayKey] || [];
        bloques.forEach((b, i) => {
          const from = (b?.from || "").trim();
          const to = (b?.to || "").trim();
          if (!from || !to) return;
          if (from >= to) invalids.push(`${label} (bloque ${i + 1})`);
          payload.push({ dia_semana: label, hora_inicio: from, hora_fin: to });
        });
      });

      if (invalids.length) {
        alert("Revisá estos bloques (inicio < fin):\n• " + invalids.join("\n• "));
        return;
      }
      if (payload.length === 0) {
        const ok = confirm("No hay bloques definidos. Se eliminarán todos los horarios. ¿Continuar?");
        if (!ok) return;
      }

      try {
        await api.put(`/emprendedores/${emprendimientoId}/horarios:replace`, payload);
      } catch (err) {
        if (err?.response?.status === 404) {
          await api.put(`/emprendedores/${emprendimientoId}/horarios/replace`, payload);
        } else {
          throw err;
        }
      }

      // ✅ aplicar en vivo
      applyHoursToUI?.(ensureAllDays(localHours));
      refreshHours?.();
      onClose?.();
    } catch (error) {
      console.error("Error al guardar horarios:", error);
      alert(error?.response?.data?.detail || "No se pudieron guardar los horarios");
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
