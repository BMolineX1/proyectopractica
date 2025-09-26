import React, { useEffect, useState, useContext } from "react";
import api from "../components/api";
import Loader from "../components/Loader";
import Button from "../components/Button";
import { UserContext } from "../context/UserContext";
import Input from "../components/Input";

export default function EmprendedorForm({ onCreated }) {
  const { user, setUser } = useContext(UserContext);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    negocio: "",
    descripcion: "",
    codigo_cliente: "",
  });
  const [emprendedorId, setEmprendedorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCardPlan, setShowCardPlan] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchEmprendedor = async () => {
    setLoading(true);
    try {
      const res = await api.get("/emprendedores/");
      // Buscar emprendimiento del usuario logueado
      const empr = res.data.find((e) => e.usuario?.id === Number(user.id));
      if (empr) {
        setFormData({
          nombre: empr.nombre,
          apellido: empr.apellido,
          negocio: empr.negocio,
          descripcion: empr.descripcion || "",
          codigo_cliente: empr.codigo_cliente || "",
        });
        setEmprendedorId(empr.id);
        setShowCardPlan(true);
      } else {
        // Si no hay emprendimiento, mostrar el formulario vacío pero no el card de plan
        setShowCardPlan(false);
      }
    } catch (err) {
      console.error("Error fetchEmprendedor:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  fetchEmprendedor();
}, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGetStarted = async () => {
    if (!user?.id) return alert("No hay usuario logueado");

    try {
      const res = await api.put(`/usuarios/${user.id}`, { rol: "emprendedor" });
      const updatedUser = res.data;
      setUser(updatedUser);
      if (res.data.token) localStorage.setItem("accessToken", res.data.token);
      setShowCardPlan(true);
    } catch (err) {
      console.error("Error activando rol de emprendedor:", err.response?.data || err);
      alert("No se pudo activar el rol de emprendedor.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return alert("No hay usuario logueado");

    try {
      // Activar usuario como emprendedor si no lo es
      if (user?.rol !== "emprendedor") {
        const resRol = await api.put(`/usuarios/${user.id}`, { rol: "emprendedor" });
        const updatedUser = resRol.data;
        setUser(updatedUser);
        if (resRol.data.token) localStorage.setItem("accessToken", resRol.data.token);
      }

      // Payload
      const payload = {
        usuario_id: parseInt(user.id),
        nombre: formData.nombre.trim() || "Nombre temporal",
        apellido: formData.apellido.trim() || "Apellido temporal",
        negocio: formData.negocio.trim() || "Negocio temporal",
        descripcion: formData.descripcion?.trim() || "",
        codigo_cliente: formData.codigo_cliente?.trim() || "",
      };

      if (emprendedorId) {
        // Actualizar si ya existe
        await api.put(`/emprendedores/${emprendedorId}`, payload);
        alert("Negocio actualizado!");
      } else {
        // Crear solo si no existe
        const res = await api.post("/emprendedores/", payload);
        setEmprendedorId(res.data.id);
        alert("Negocio creado! Ahora puedes modificarlo o eliminarlo.");
        if (onCreated) onCreated();
      }
    } catch (err) {
      console.error("Error handleSubmit:", err.response?.data || err);
      if (err.response?.data?.codigo_cliente) {
        alert("Código cliente ya registrado. Elige otro.");
      } else {
        alert("Error guardando negocio. Revisa los datos o el token.");
      }
    }
  };

  const handleDelete = async () => {
    if (!emprendedorId) return;
    if (!window.confirm("¿Seguro que deseas eliminar este negocio?")) return;

    try {
      await api.delete(`/emprendedores/${emprendedorId}`);
      setFormData({ nombre: "", apellido: "", negocio: "", descripcion: "", codigo_cliente: "" });
      setEmprendedorId(null);
      setShowCardPlan(false); // permitir crear uno nuevo después
      alert("Negocio eliminado! Ahora puedes crear un nuevo emprendimiento.");
    } catch (err) {
      console.error("Error handleDelete:", err.response?.data || err);
      alert("Error eliminando negocio");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto p-4 z-10 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-black mb-6">Gestión de Negocio</h1>

      {user?.rol !== "emprendedor" && !showCardPlan && (
        <div className="flex justify-center">
          <Button
            onClick={handleGetStarted}
            className="bg-green-500 text-white font-bold py-3 px-6 rounded-full"
          >
            Get Started
          </Button>
        </div>
      )}

      {(showCardPlan || user?.rol === "emprendedor") && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 mt-6">
          <Input type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} required />
          <Input type="text" name="apellido" placeholder="Apellido" value={formData.apellido} onChange={handleChange} required />
          <Input type="text" name="negocio" placeholder="Nombre del negocio" value={formData.negocio} onChange={handleChange} required />
          <textarea name="descripcion" rows="3" placeholder="Descripción" value={formData.descripcion} onChange={handleChange} />
          <Input type="text" name="codigo_cliente" placeholder="Código cliente (opcional)" value={formData.codigo_cliente} onChange={handleChange} />

          <div className="col-span-full mt-6 flex gap-4">
            <Button type="submit" className="flex-1 bg-cordes-blue hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full">
              {emprendedorId ? "Actualizar Negocio" : "Crear Negocio"}
            </Button>
            {emprendedorId && (
              <button
                type="button"
                onClick={handleDelete}
                className="text-white bg-gradient-to-br from-pink-500 to-orange-400 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
              >
                Eliminar Negocio
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
