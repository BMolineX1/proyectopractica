import React, { useEffect, useState } from "react";
import axios from "axios"; // Usamos axios directamente para poder agregar headers
import Loader from "../components/Loader";
import Button from "../components/Button";

export default function EmprendedorForm({ usuarioId, onCreated }) {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    direccion: "",
    codigoCliente: "",
  });

  const [emprendedorId, setEmprendedorId] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================================
  // Traer datos si ya existe un negocio
  // ================================
  useEffect(() => {
    const fetchEmprendedor = async () => {
      try {
        const token = localStorage.getItem("token"); // 🔑 Traemos el JWT guardado
        const res = await axios.get(`http://localhost:8000/emprendedores/`, {
          headers: {
            Authorization: `Bearer ${token}`, // 🔑 Agregamos el token al header
          },
        });
        const empr = res.data.find((e) => e.usuario_id === usuarioId);
        if (empr) {
          setFormData({
            nombre: empr.nombre,
            descripcion: empr.descripcion,
            direccion: empr.direccion,
            codigoCliente: empr.codigo_cliente || "",
          });
          setEmprendedorId(empr.id);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchEmprendedor();
  }, [usuarioId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ================================
  // Crear o actualizar emprendimiento
  // ================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token"); // 🔑 Traemos token nuevamente

      if (emprendedorId) {
        // Editar negocio existente
        await axios.put(
          `http://localhost:8000/emprendedores/${emprendedorId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`, // 🔑 Incluimos el token
            },
          }
        );
        alert("Negocio actualizado!");
      } else {
        // Crear nuevo negocio
        const res = await axios.post(
          `http://localhost:8000/emprendedores/`,
          { ...formData, usuario_id: usuarioId },
          {
            headers: {
              Authorization: `Bearer ${token}`, // 🔑 Incluimos el token
            },
          }
        );
        setEmprendedorId(res.data.id);
        alert("Negocio creado!");

        // Avisamos al Dashboard que se creó un emprendimiento para que cambie la vista
        if (onCreated) onCreated();
      }
    } catch (err) {
      console.error(err);
      alert("Error guardando negocio. Revisa tu token o permisos.");
    }
  };

  const handleDelete = async () => {
    if (!emprendedorId) return;
    if (!window.confirm("¿Seguro que deseas eliminar este negocio?")) return;

    try {
      const token = localStorage.getItem("token"); // 🔑 Traemos token
      await axios.delete(`http://localhost:8000/emprendedores/${emprendedorId}`, {
        headers: {
          Authorization: `Bearer ${token}`, // 🔑 Incluimos el token
        },
      });
      setFormData({
        nombre: "",
        descripcion: "",
        direccion: "",
        codigoCliente: "",
      });
      setEmprendedorId(null);
      alert("Negocio eliminado!");
    } catch (err) {
      console.error(err);
      alert("Error eliminando negocio");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto p-4 z-10 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-black mb-6">Gestión de Negocio</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
        <div className="p-2">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre del negocio"
            value={formData.nombre}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm p-2 bg-[#f6f6f6] focus:border-[#8c0327] focus:ring-[#8c0327]"
            required
          />
        </div>

        <div className="p-2">
          <textarea
            name="descripcion"
            rows="3"
            placeholder="Descripción"
            value={formData.descripcion}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm p-2 bg-[#f6f6f6] focus:border-[#8c0327] focus:ring-[#8c0327]"
          />
        </div>

        <div className="p-2">
          <input
            type="text"
            name="direccion"
            placeholder="Dirección"
            value={formData.direccion}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm p-2 bg-[#f6f6f6] focus:border-[#8c0327] focus:ring-[#8c0327]"
          />
        </div>

        <div className="col-span-full mt-6 flex gap-4">
          <Button
            type="submit"
            className="flex-1 bg-cordes-blue hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full"
          >
            {emprendedorId ? "Actualizar Negocio" : "Crear Negocio"}
          </Button>
          {emprendedorId && (
            <button type="button" onClick={handleDelete} className="">
              Eliminar Negocio
            </button>
          )}
        </div>
      </form>
    </div>
  );
}