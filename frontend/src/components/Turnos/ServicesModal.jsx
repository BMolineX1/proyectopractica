function ServicesModal({ services, onAdd, onUpdate, onDelete, onClose }) {
  const [newService, setNewService] = useState({ name: "", duration: 30 });

  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-semibold mb-3">Gestionar servicios</h3>

      <ul className="divide-y divide-gray-200 mb-3">
        {services.map((s) => (
          <li key={s.id} className="flex justify-between items-center py-2">
            <div>
              <span className="font-semibold">{s.name}</span> — {s.duration} min
            </div>
            <div className="flex gap-2">
              <button
                className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                onClick={() => onDelete(s.id)}
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Nuevo servicio */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Nombre del servicio"
          className="w-full border p-2 rounded"
          value={newService.name}
          onChange={(e) => setNewService({ ...newService, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Duración (min)"
          className="w-full border p-2 rounded"
          value={newService.duration}
          onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
        />
        <button
          className="w-full bg-blue-600 text-white p-2 rounded"
          onClick={() => {
            if (!newService.name) return alert("Falta nombre");
            onAdd(newService.name, newService.duration);
            setNewService({ name: "", duration: 30 });
          }}
        >
          Agregar servicio
        </button>
      </div>
    </Modal>
  );
}
