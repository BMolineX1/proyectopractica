// src/pages/UpdateUserForm.jsx
import React, { useState, useContext, useEffect, useRef } from "react";
import { UserContext } from "../context/UserContext";
import api from "../components/api";
import Button from "../components/Button";
import Input from "../components/Input";

export default function UpdateUserForm() {
  const { user, setUser } = useContext(UserContext);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    nombre: "",
    apellido: "",
    dni: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Autoocultar mensaje a los 3s
  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(() => setMensaje(""), 3000);
    return () => clearTimeout(t);
  }, [mensaje]);

  // Cargar datos desde perfil
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await api.get("/usuarios/perfil");
        const u = res.data || {};
        setFormData({
          username: u.username ?? user.username ?? "",
          email: u.email ?? user.email ?? "",
          nombre: u.nombre ?? "",
          apellido: u.apellido ?? "",
          dni: u.dni ?? "",
        });
        if (u.avatar_url) setAvatarPreview(u.avatar_url);
      } catch {
        setFormData({
          username: user?.username || "",
          email: user?.email || "",
          nombre: user?.nombre || "",
          apellido: user?.apellido || "",
          dni: user?.dni || "",
        });
      }
    })();
  }, [user]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview("");
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const uploadAvatarIfNeeded = async (userId) => {
    if (!avatarFile) return;
    const fd = new FormData();
    fd.append("avatar", avatarFile);
    try {
      const res = await api.post(`/usuarios/${userId}/avatar`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.avatar_url) setAvatarPreview(res.data.avatar_url);
    } catch (err) {
      console.warn("Subida de avatar opcional falló:", err?.response?.data || err);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setLoading(true);
    setMensaje("");

    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        nombre: formData.nombre.trim() || null,
        apellido: formData.apellido.trim() || null,
        dni: formData.dni.trim() || null,
      };

      const { data } = await api.put(`/usuarios/${user.id}`, payload);
      await uploadAvatarIfNeeded(user.id);

      setUser({
        ...user,
        username: data.username,
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        dni: data.dni,
      });

      setMensaje("Perfil actualizado correctamente.");
    } catch (error) {
      console.error(error);
      const msg = error?.response?.data?.detail || "Error al actualizar el perfil.";
      setMensaje(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto mt-8">
      {/* Encabezado */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-400 bg-clip-text text-transparent">
          Editar perfil
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Mantené tu información al día. Podés actualizar tu foto, nombre y contacto.
        </p>
      </div>

      {/* Card con borde degradé y glass interior */}
      <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-400 shadow-2xl">
        {/* Brillos metálicos */}
        <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

        <div className="relative rounded-2xl bg-white/85 backdrop-blur-md">
          {/* Barra superior sutil */}
          <div className="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-blue-500 via-blue-400 to-emerald-300" />

          <div className="p-6 md:p-8">
            {/* Mensaje */}
            {typeof mensaje === "string" && mensaje && (
              <div
                className={`mb-5 rounded-xl px-4 py-2 text-sm font-medium ${
                  /error|incorrecta|en uso|registrado|422|400/i.test(mensaje)
                    ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                    : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                }`}
              >
                {mensaje}
              </div>
            )}

            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6">
              {/* Avatar + Campos */}
              <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6 items-start">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    {/* Borde degradé */}
                    <div className="rounded-full p-[2px] bg-gradient-to-br from-blue-600 via-blue-500 to-emerald-400">
                      <div className="h-28 w-28 rounded-full overflow-hidden bg-white/60 backdrop-blur-sm ring-1 ring-white/40">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-gray-400 text-xs">
                            Sin foto
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Destello */}
                    <div className="pointer-events-none absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white/50 blur-md" />
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 px-4 py-2 text-sm font-semibold text-white shadow-lg ring-1 ring-blue-300/40 hover:scale-[1.02] transition"
                  >
                    <span className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Subir foto
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onAvatarChange}
                    className="hidden"
                  />
                </div>

                {/* Inputs */}
                <div className="grid gap-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <Input
                          name="username"
                          value={formData.username}
                          onChange={onChange}
                          placeholder="Usuario"
                          className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                          required
                        />
                        <span className="pointer-events-none absolute -top-2 left-3 bg-white/80 px-2 text-xs font-semibold text-blue-700 rounded-full">
                          Usuario
                        </span>
                      </div>

                      <div className="relative">
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={onChange}
                          placeholder="Correo electrónico"
                          className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                          required
                        />
                        <span className="pointer-events-none absolute -top-2 left-3 bg-white/80 px-2 text-xs font-semibold text-blue-700 rounded-full">
                          Correo
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <Input
                          name="nombre"
                          value={formData.nombre}
                          onChange={onChange}
                          placeholder="Nombre"
                          className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                        />
                        <span className="pointer-events-none absolute -top-2 left-3 bg-white/80 px-2 text-xs font-semibold text-blue-700 rounded-full">
                          Nombre
                        </span>
                      </div>

                      <div className="relative">
                        <Input
                          name="apellido"
                          value={formData.apellido}
                          onChange={onChange}
                          placeholder="Apellido"
                          className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                        />
                        <span className="pointer-events-none absolute -top-2 left-3 bg-white/80 px-2 text-xs font-semibold text-blue-700 rounded-full">
                          Apellido
                        </span>
                      </div>
                    </div>

                    <div className="relative">
                      <Input
                        name="dni"
                        value={formData.dni}
                        onChange={onChange}
                        placeholder="DNI"
                        className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                      />
                      <span className="pointer-events-none absolute -top-2 left-3 bg-white/80 px-2 text-xs font-semibold text-blue-700 rounded-full">
                        DNI
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full rounded-xl bg-gradient-to-r from-blue-500 to-emerald-400
                    text-white font-bold py-3 px-4 shadow-lg ring-1 ring-blue-300/40
                    hover:scale-[1.01] hover:shadow-xl transition
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                >
                  {loading ? "Guardando..." : "Guardar cambios"}
                </Button>

                <p className="mt-3 text-center text-xs text-gray-600">
                  ¿Cambiar contraseña? Andá a la pestaña <strong>Seguridad</strong>.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
