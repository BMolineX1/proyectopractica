// src/pages/EmprendedorForm.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import api from "../components/api";
import Loader from "../components/Loader";
import Button from "../components/Button";
import { UserContext } from "../context/UserContext";
import Input from "../components/Input";

export default function EmprendedorForm({ onCreated }) {
  const { user, setUser } = useContext(UserContext);

  const [formData, setFormData] = useState({
    negocio: "",
    descripcion: "",
    codigo_cliente: "",
    // extras (opcionales)
    cuit: "",
    telefono: "",
    direccion: "",
    rubro: "",
    instagram: "",
    web: "",
    email_contacto: "",
  });

  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const fileInputRef = useRef(null);

  const [emprendedorId, setEmprendedorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [showCardPlan, setShowCardPlan] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  // autoocultar mensaje
  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(() => setMensaje(""), 3000);
    return () => clearTimeout(t);
  }, [mensaje]);

  // Cargar mi emprendedor
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const fetchEmprendedor = async () => {
      setLoading(true);
      try {
        // /emprendedores/mi ya garantiza codigo_cliente si faltaba
        const me = await api.get("/emprendedores/mi");
        const { id, codigo_cliente } = me.data || {};
        if (id) {
          setEmprendedorId(id);
          setShowCardPlan(true);
          const det = await api.get(`/emprendedores/${id}`);
          const e = det.data;
          setFormData((prev) => ({
            ...prev,
            negocio: e.negocio || "",
            descripcion: e.descripcion || "",
            codigo_cliente: (codigo_cliente || e.codigo_cliente || ""),
            cuit: e.cuit || "",
            telefono: e.telefono || "",
            direccion: e.direccion || "",
            rubro: e.rubro || "",
            instagram: e.instagram || "",
            web: e.web || "",
            email_contacto: e.email_contacto || "",
          }));
          if (e.foto_url) setFotoPreview(e.foto_url);
        } else {
          setShowCardPlan(user?.rol === "emprendedor");
        }
      } catch {
        setShowCardPlan(user?.rol === "emprendedor");
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

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFotoFile(null);
      setFotoPreview("");
      return;
    }
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setFotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const onlyDigits = (s) => (s || "").replace(/\D+/g, "");
  const isValidCuit = (cuit) => onlyDigits(cuit).length === 11;

  const activateEmprendedor = async () => {
    const res = await api.put(`/usuarios/${user.id}/activar_emprendedor`);
    if (res.data?.user) setUser(res.data.user);
    if (res.data?.token) localStorage.setItem("accessToken", res.data.token);
    setShowCardPlan(true);
    return res.data?.emprendedor?.id;
  };

  const handleGetStarted = async () => {
    if (!user?.id) return alert("No hay usuario logueado");
    try {
      const nuevoId = await activateEmprendedor();
      if (nuevoId) setEmprendedorId(nuevoId);
    } catch (err) {
      console.error("Error activando rol de emprendedor:", err.response?.data || err);
      alert("No se pudo activar el rol de emprendedor.");
    }
  };

  const uploadFotoIfNeeded = async (id) => {
    if (!id || !fotoFile) return;
    const fd = new FormData();
    fd.append("foto", fotoFile);
    try {
      const res = await api.post(`/emprendedores/${id}/foto`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.foto_url) setFotoPreview(res.data.foto_url);
    } catch (err) {
      console.warn("No se pudo subir la foto (endpoint opcional):", err.response?.data || err);
    }
  };

  const toOpt = (v) => {
    const t = (v || "").trim();
    return t ? t : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return alert("No hay usuario logueado");

    try {
      if (user?.rol !== "emprendedor") {
        const nuevoId = await activateEmprendedor();
        if (nuevoId) setEmprendedorId(nuevoId);
      }
      if (formData.cuit && !isValidCuit(formData.cuit)) {
        return alert("El CUIT debe tener 11 dígitos.");
      }

      if (emprendedorId) {
        // PUT → solo campos del comercio (código se gestiona aparte)
        const payloadPut = {
          negocio: toOpt(formData.negocio) || "Mi negocio",
          descripcion: toOpt(formData.descripcion),
          cuit: toOpt(formData.cuit),
          telefono: toOpt(formData.telefono),
          direccion: toOpt(formData.direccion),
          rubro: toOpt(formData.rubro),
          instagram: toOpt(formData.instagram),
          web: toOpt(formData.web),
          email_contacto: toOpt(formData.email_contacto),
        };
        await api.put(`/emprendedores/${emprendedorId}`, payloadPut);
        await uploadFotoIfNeeded(emprendedorId);
        setMensaje("Negocio actualizado!");
      } else {
        // POST → crear (código lo genera el backend)
        const payloadPost = {
          usuario_id: Number(user.id),
          negocio: toOpt(formData.negocio) || "Mi negocio",
          descripcion: toOpt(formData.descripcion),
          cuit: toOpt(formData.cuit),
          telefono: toOpt(formData.telefono),
          direccion: toOpt(formData.direccion),
          rubro: toOpt(formData.rubro),
          instagram: toOpt(formData.instagram),
          web: toOpt(formData.web),
          email_contacto: toOpt(formData.email_contacto),
        };
        const res = await api.post("/emprendedores/", payloadPost);
        const id = res.data?.id;
        setEmprendedorId(id);
        await uploadFotoIfNeeded(id);
        if (onCreated) onCreated();

        // refrescamos para traer codigo_cliente generado por el backend
        const me = await api.get("/emprendedores/mi");
        setFormData((prev) => ({ ...prev, codigo_cliente: me.data?.codigo_cliente || "" }));
        setMensaje("Negocio creado! Ya podés compartir tu código.");
      }
    } catch (err) {
      console.error("Error handleSubmit:", err.response?.data || err);
      const d = err.response?.data;
      if (d?.detail?.includes("UNIQUE") || d?.codigo_cliente) {
        setMensaje("Código cliente ya registrado. Elegí otro.");
      } else if (d?.detail) {
        setMensaje(`Error: ${d.detail}`);
      } else {
        setMensaje("Error guardando negocio. Revisá los datos o el token.");
      }
    }
  };

  const handleDelete = async () => {
    if (!emprendedorId) return;
    if (!window.confirm("¿Seguro que deseas eliminar este negocio?")) return;
    try {
      await api.delete(`/emprendedores/${emprendedorId}`);
      setFormData({
        negocio: "",
        descripcion: "",
        codigo_cliente: "",
        cuit: "",
        telefono: "",
        direccion: "",
        rubro: "",
        instagram: "",
        web: "",
        email_contacto: "",
      });
      setEmprendedorId(null);
      setFotoFile(null);
      setFotoPreview("");
      setShowCardPlan(user?.rol === "emprendedor" ? true : false);
      setMensaje("Negocio eliminado. Podés crear uno nuevo cuando quieras.");
    } catch (err) {
      console.error("Error handleDelete:", err.response?.data || err);
      setMensaje("Error eliminando negocio");
    }
  };

  // =========================
  // Código público para clientes
  // =========================
  const handleGenerateCode = async () => {
    if (!emprendedorId) {
      return alert("Primero creá tu negocio para generar un código.");
    }
    setGenLoading(true);
    try {
      // Intento 1: endpoint explícito (si lo agregaste en el back)
      await api.post(`/emprendedores/${emprendedorId}/generar-codigo`);
    } catch (err) {
      if (err?.response?.status !== 404) {
        console.warn("generar-codigo no disponible:", err.response?.data || err);
      }
    } finally {
      try {
        const me = await api.get("/emprendedores/mi");
        setFormData((prev) => ({ ...prev, codigo_cliente: me.data?.codigo_cliente || "" }));
        if (!me.data?.codigo_cliente) {
          setMensaje("No fue posible generar el código. Volvé a intentar.");
        } else {
          setMensaje("Código generado correctamente.");
        }
      } catch (e) {
        setMensaje("No se pudo obtener el código. Reintentá.");
      }
      setGenLoading(false);
    }
  };

  const handleCopyCode = async () => {
    const code = (formData.codigo_cliente || "").toUpperCase().trim();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setMensaje("¡Código copiado al portapapeles!");
    } catch {
      setMensaje("No se pudo copiar. Copialo manualmente.");
    }
  };

  const handleOpenPublic = () => {
    const code = (formData.codigo_cliente || "").toUpperCase().trim();
    if (!code) return;
    const url = `${window.location.origin}/reservar/${encodeURIComponent(code)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) return <Loader />;

  return (
    <div className="relative w-full max-w-3xl mx-auto mt-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-400 bg-clip-text text-transparent">
          Gestión de Negocio
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Creá y administrá tu emprendimiento. Subí tu logo, completá tu info y compartí tu código de reservas.
        </p>
      </div>

      {/* Card principal */}
      <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-400 shadow-2xl">
        <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

        <div className="relative rounded-2xl bg-white/85 backdrop-blur-md">
          <div className="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-blue-500 via-blue-400 to-emerald-300" />

          <div className="p-6 md:p-8">
            {/* Mensaje */}
            {mensaje && (
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

            {/* Bloque de CÓDIGO PARA CLIENTES */}
            <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-cyan-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-blue-800">Código para clientes</h2>

                {!formData.codigo_cliente ? (
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    disabled={genLoading}
                    className="rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 text-white text-sm font-semibold px-4 py-2 shadow hover:scale-[1.01] transition disabled:opacity-60"
                  >
                    {genLoading ? "Generando…" : "Generar código"}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="rounded-full bg-white text-blue-700 text-sm font-semibold px-3 py-2 ring-1 ring-blue-200 hover:bg-blue-50"
                    >
                      Copiar
                    </button>

                    {/* 🔥 NUEVO: Generar nuevo código (remplaza el actual) */}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm("¿Generar un nuevo código? El anterior dejará de usarse.")) return;
                        await handleGenerateCode();
                      }}
                      disabled={genLoading}
                      className="rounded-full bg-white text-blue-700 text-sm font-semibold px-3 py-2 ring-1 ring-blue-200 hover:bg-blue-50 disabled:opacity-60"
                      title="Cambia tu código público por uno nuevo"
                    >
                      {genLoading ? "Generando…" : "Generar nuevo código"}
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenPublic}
                      className="rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 text-white text-sm font-semibold px-3 py-2 shadow hover:scale-[1.01] transition"
                    >
                      Abrir grilla
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <div className="rounded-xl bg-white/80 border border-blue-100 px-4 py-3 flex items-center justify-between">
                  <div className="text-sm text-gray-600">Tu código</div>
                  <div className="text-lg font-extrabold tracking-widest text-blue-800">
                    {formData.codigo_cliente ? formData.codigo_cliente.toUpperCase() : "—"}
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Compartí este código con tus clientes para que reserven en <b>/reservar/&lt;código&gt;</b>. <br />
                  <span className="text-[11px] text-gray-400">
                    “Generar nuevo código” reemplaza el actual (el link viejo dejará de funcionar).
                  </span>
                </p>
              </div>
            </div>

            {/* CTA plan si aún no es emprendedor */}
            {user?.rol !== "emprendedor" && !showCardPlan && (
              <div className="flex justify-center mb-6">
                <Button
                  onClick={handleGetStarted}
                  className="rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 text-white font-bold py-3 px-6 shadow-lg ring-1 ring-blue-300/40 hover:scale-[1.01] transition"
                >
                  Activar plan de Emprendedor
                </Button>
              </div>
            )}

            {(showCardPlan || user?.rol === "emprendedor") && (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6 items-start">
                  {/* Logo */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full p-[2px] bg-gradient-to-br from-blue-600 via-blue-500 to-emerald-400">
                      <div className="h-28 w-28 rounded-full overflow-hidden bg-white/60 backdrop-blur-sm ring-1 ring-white/40">
                        {fotoPreview ? (
                          <img src={fotoPreview} alt="logo" className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-gray-400 text-xs">
                            Sin logo
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 px-4 py-2 text-sm font-semibold text-white shadow-lg ring-1 ring-blue-300/40 hover:scale-[1.02] transition"
                      title="Subir foto/logo"
                    >
                      <span className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      Subir foto
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFotoChange}
                      className="hidden"
                    />
                  </div>

                  {/* Campos del comercio */}
                  <div className="grid gap-4">
                    <Input
                      type="text"
                      name="negocio"
                      placeholder="Nombre del negocio"
                      value={formData.negocio}
                      onChange={handleChange}
                      required
                      className="rounded-xl bg-white/80"
                    />

                    {/* Extras (opcionales) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input type="text" name="cuit" placeholder="CUIT (11 dígitos)" value={formData.cuit} onChange={handleChange} className="rounded-xl bg-white/80" />
                      <Input type="text" name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleChange} className="rounded-xl bg-white/80" />
                      <Input type="text" name="direccion" placeholder="Dirección" value={formData.direccion} onChange={handleChange} className="rounded-xl bg-white/80" />
                      <Input type="text" name="rubro" placeholder="Rubro (ej: Peluquería, Veterinaria)" value={formData.rubro} onChange={handleChange} className="rounded-xl bg-white/80" />
                      <Input type="text" name="instagram" placeholder="Instagram (ej: @mi_negocio)" value={formData.instagram} onChange={handleChange} className="rounded-xl bg-white/80" />
                      <Input type="url" name="web" placeholder="Sitio web (opcional)" value={formData.web} onChange={handleChange} className="rounded-xl bg-white/80" />
                      <Input type="email" name="email_contacto" placeholder="Email de contacto (opcional)" value={formData.email_contacto} onChange={handleChange} className="rounded-xl bg-white/80" />
                    </div>

                    {/* Descripción */}
                    <textarea
                      name="descripcion"
                      rows="3"
                      placeholder="Descripción del emprendimiento"
                      value={formData.descripcion}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>

                {/* Acciones */}
                <div className="mt-2 grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4">
                  <Button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-emerald-400 text-white font-bold py-3 px-4 shadow-lg ring-1 ring-blue-300/40 hover:scale-[1.01] hover:shadow-xl transition"
                  >
                    {emprendedorId ? "Actualizar Negocio" : "Crear Negocio"}
                  </Button>

                  {emprendedorId && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 text-white font-semibold px-5 py-3 shadow ring-1 ring-pink-200 hover:scale-[1.01] transition"
                    >
                      Eliminar Negocio
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
