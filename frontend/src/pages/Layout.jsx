// src/pages/Layout.jsx
import React, { useState, useContext, useEffect, useRef } from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import TurnateLogo from "/images/TurnateLogo.png"; // si lo tenés en public/images

export default function Layout() {
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();

  // UI state
  const [openMobile, setOpenMobile] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);

  // refs p/ cerrar dropdown con click afuera
  const dropdownRef = useRef(null);
  const dropdownBtnRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout(); // limpia user + localStorage si corresponde
    } catch (err) {
      console.error(err);
    } finally {
      setOpenDropdown(false);
      setOpenMobile(false);
      navigate("/login");
    }
  };

  // cerrar dropdown al clickear afuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        openDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        dropdownBtnRef.current &&
        !dropdownBtnRef.current.contains(e.target)
      ) {
        setOpenDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // cerrar menús con ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        setOpenDropdown(false);
        setOpenMobile(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // estilos helpers
  const linkBase = "px-4 py-2 rounded-lg text-sm font-medium transition";
  const navClass = ({ isActive }) =>
    `${linkBase} ${isActive ? "bg-white text-blue-600 shadow" : "text-white hover:bg-white/10"}`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* NAVBAR */}
      <header className="bg-gradient-to-r from-blue-600 to-cyan-400 shadow fixed w-full z-40">
        <div className="mx-auto max-w-6xl flex items-center justify-between p-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <img src={TurnateLogo} alt="Logo Turnate" className="h-10 w-auto select-none" draggable="false" />
              <span className="font-bold text-xl bg-gradient-to-r from-white via-cyan-200 to-blue-300 text-transparent bg-clip-text">
                Turnate
              </span>
            </Link>
          </div>

          {/* Nav desktop */}
          <nav className="hidden md:flex gap-3 items-center">
            <NavLink to="/" className={navClass}>Home</NavLink>
            <NavLink to="/nosotros" className={navClass}>Nosotros</NavLink>

            {/* Solo cliente o visitante ven "Reservar" */}
            {(!user || user?.rol === "cliente") && (
              <NavLink to="/reservar" className={navClass}>Reservar</NavLink>
            )}

            {/* Solo emprendedor ve "Panel" */}
            {user?.rol === "emprendedor" && (
              <NavLink to="/emprendedor" className={navClass}>Panel</NavLink>
            )}

            {/* Auth / Usuario */}
            {user ? (
              <div className="relative">
                <button
                  ref={dropdownBtnRef}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={openDropdown}
                  onClick={() => setOpenDropdown((s) => !s)}
                  className="flex items-center gap-2 rounded-full outline-none focus:ring-4 focus:ring-white/40"
                >
                  <img
                    className="w-9 h-9 rounded-full border border-white/40 object-cover"
                    src={"https://ui-avatars.com/api/?name=U&background=0ea5e9&color=fff"}
                    alt="Avatar usuario"
                  />
                  <span className="sr-only">Abrir menú de usuario</span>
                </button>

                {openDropdown && (
                  <div
                    ref={dropdownRef}
                    role="menu"
                    aria-label="Menú de usuario"
                    className="absolute right-0 mt-3 w-56 rounded-xl bg-white shadow-lg ring-1 ring-black/5 overflow-hidden"
                  >
                    <div className="px-4 py-3">
                      <p className="text-sm text-gray-500">
                        Hola, {user?.username || user?.rol || "Usuario"}
                      </p>
                    </div>
                    <ul className="py-1">
                      <li>
                        <NavLink
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => setOpenDropdown(false)}
                        >
                          Panel de control
                        </NavLink>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          Cerrar sesión
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <>
                <NavLink to="/login" className={navClass}>Login</NavLink>
                <NavLink to="/registro" className={navClass}>Registrarse</NavLink>
              </>
            )}
          </nav>

          {/* Botón hamburguesa (mobile) */}
          <div className="md:hidden">
            <button
              onClick={() => setOpenMobile((s) => !s)}
              className="focus:outline-none focus:ring-4 focus:ring-white/40 rounded-md p-1"
              aria-label="Abrir menú"
              aria-expanded={openMobile}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Menú Mobile */}
        <div
          className={`md:hidden origin-top ${
            openMobile ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 pointer-events-none"
          } bg-white shadow transition-transform duration-200 ease-out`}
        >
          <ul className="flex flex-col gap-1 p-4 text-slate-700">
            <li>
              <NavLink to="/" onClick={() => setOpenMobile(false)} className="block px-3 py-2 rounded-md hover:bg-slate-100">
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/nosotros" onClick={() => setOpenMobile(false)} className="block px-3 py-2 rounded-md hover:bg-slate-100">
                Nosotros
              </NavLink>
            </li>

            {/* Reservar: solo cliente o visitante */}
            {(!user || user?.rol === "cliente") && (
              <li>
                <NavLink to="/reservar" onClick={() => setOpenMobile(false)} className="block px-3 py-2 rounded-md hover:bg-slate-100">
                  Reservar
                </NavLink>
              </li>
            )}

            {/* Panel: solo emprendedor */}
            {user?.rol === "emprendedor" && (
              <li>
                <NavLink to="/emprendedor" onClick={() => setOpenMobile(false)} className="block px-3 py-2 rounded-md hover:bg-slate-100">
                  Panel
                </NavLink>
              </li>
            )}

            {/* Auth en mobile */}
            {!user && (
              <>
                <li className="mt-2">
                  <NavLink to="/login" onClick={() => setOpenMobile(false)} className="block px-3 py-2 rounded-md bg-blue-600 text-white text-center">
                    Login
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/registro" onClick={() => setOpenMobile(false)} className="block px-3 py-2 rounded-md border border-blue-500 text-blue-600 text-center">
                    Registrarse
                  </NavLink>
                </li>
              </>
            )}

            {/* Legal en mobile */}
            <li className="mt-2 border-t pt-2">
              <NavLink to="/terminos" onClick={() => setOpenMobile(false)} className="block px-3 py-2 rounded-md hover:bg-slate-100">
                Términos y Condiciones
              </NavLink>
            </li>
            <li>
              <NavLink to="/privacidad" onClick={() => setOpenMobile(false)} className="block px-3 py-2 rounded-md hover:bg-slate-100">
                Política de Privacidad
              </NavLink>
            </li>
          </ul>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="flex-1 pt-20 p-6">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="mx-auto max-w-6xl px-4 py-10 grid grid-cols-1 sm:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-semibold text-lg">Turnate</h3>
            <p className="mt-2 text-sm text-slate-400">
              Plataforma digital para gestionar turnos de forma simple y accesible.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold">Navegación</h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li><Link to="/" className="hover:text-white">Inicio</Link></li>
              <li><Link to="/nosotros" className="hover:text-white">Nosotros</Link></li>
              <li><Link to="/reservar" className="hover:text-white">Reservar</Link></li>
              <li><Link to="/emprendedor" className="hover:text-white">Panel</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold">Legal</h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li><Link to="/terminos" className="hover:text-white">Términos y Condiciones</Link></li>
              <li><Link to="/privacidad" className="hover:text-white">Política de Privacidad</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold">Contacto</h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li>Email: contactoturnate@gmail.com</li>
              <li>WhatsApp: +54 3644 12345678</li>
            </ul>
            <div className="mt-3 flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-white">Facebook</a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white">LinkedIn</a>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-700 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Turnate. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
