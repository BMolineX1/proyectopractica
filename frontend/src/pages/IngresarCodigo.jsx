import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../components/api";

// Alfabeto seguro: sin O, I, 0, 1
const SAFE_REGEX = /[A-HJ-NP-Z2-9]/g;
const SAFE_PATTERN = "^[A-HJ-NP-Z2-9]{4,10}$";

export default function IngresarCodigo() {
  const [codigo, setCodigo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Pre-carga desde query ?code=ABC123
  useEffect(() => {
    const q = (searchParams.get("code") || "").toUpperCase();
    if (!q) return;
    const onlySafe = (q.match(SAFE_REGEX) || []).join("");
    setCodigo(onlySafe);
  }, [searchParams]);

  const sanitized = useMemo(() => codigo, [codigo]);

  const handleChange = (value) => {
    const up = (value || "").toUpperCase();
    const onlySafe = (up.match(SAFE_REGEX) || []).join("");
    setCodigo(onlySafe);
    if (!onlySafe) setMensaje("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = sanitized.trim();
    if (!code) return setMensaje("Ingresá un código válido.");
    setMensaje("");
    setLoading(true);

    try {
      const { data } = await api.get(`/emprendedores/by-codigo/${encodeURIComponent(code)}`);
      if (data?.id) {
        navigate(`/reservar/${code}`);
      } else {
        setMensaje("El código ingresado no corresponde a ningún emprendedor.");
      }
    } catch (err) {
      setMensaje(err?.response?.data?.detail || "El código ingresado no corresponde a ningún emprendedor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-600 to-cyan-400 flex items-center justify-center p-4">
      <div className="w-full max-w-xl px-6">
        <div className="rounded-2xl p-[1px] bg-white/30 shadow-2xl">
          <div className="rounded-2xl bg-white/90 backdrop-blur-md">
            <div className="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-300" />
            <div className="p-6 md:p-8">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-center bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Reservar turno
              </h1>
              <p className="mt-1 text-center text-sm text-gray-600">
                Ingresá el código que te proporcionó el emprendedor.
              </p>

              {mensaje && (
                <div className="mt-4 rounded-xl bg-blue-50 text-blue-700 text-sm px-4 py-2 ring-1 ring-blue-200">
                  {mensaje}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 relative">
                <label htmlFor="codigo" className="sr-only">Código de emprendedor</label>
                <input
                  id="codigo"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={codigo}
                  onChange={(e) => handleChange(e.target.value)}
                  placeholder="Ej: ABC123"
                  maxLength={10}
                  pattern={SAFE_PATTERN}
                  title="Usá solo letras y números (sin O, I, 0, 1)."
                  className="w-full rounded-full border border-transparent bg-white px-5 py-3 pr-14 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="absolute top-1/2 -translate-y-1/2 right-1 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-400 shadow hover:scale-[1.02] transition disabled:opacity-60"
                  title="Buscar"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                         viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round"
                            d="M21 21l-4.5-4.5m0 0A7.5 7.5 0 1016.5 16.5z" />
                    </svg>
                  )}
                </button>
              </form>

              <div className="mt-2 text-xs text-gray-500">
                Código (normalizado): <b className="text-gray-700">{sanitized || "—"}</b>
              </div>

              <p className="mt-4 text-xs text-center text-gray-500">
                ¿No tenés un código? Pedíselo al emprendedor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
