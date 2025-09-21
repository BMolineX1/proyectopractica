function HoursModal({ hours, onChange, onClose }) {
  const dias = {
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
      <h3 className="text-lg font-semibold mb-3">Horarios semanales</h3>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {Object.keys(dias).map((key) => (
          <div key={key} className="flex justify-between items-center">
            <span className="w-24">{dias[key]}</span>
            {hours[key].from === "closed" ? (
              <span className="text-gray-500">Cerrado</span>
            ) : (
              <div className="flex gap-2">
                <input
                  type="time"
                  className="border p-1 rounded"
                  value={hours[key].from}
                  onChange={(e) => onChange(key, "from", e.target.value)}
                />
                <span>-</span>
                <input
                  type="time"
                  className="border p-1 rounded"
                  value={hours[key].to}
                  onChange={(e) => onChange(key, "to", e.target.value)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-3">
        <button
          className="px-3 py-1 rounded bg-gray-200 text-gray-800"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
