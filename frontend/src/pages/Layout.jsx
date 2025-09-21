import React, { useState, useContext } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import TurnateLogo from "/images/TurnateLogo.png"; // ajusta la ruta

export default function Layout() {
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* NAVBAR */}
      <header className="bg-gradient-to-r from-blue-600 to-cyan-400 shadow fixed w-full z-40">
        <div className="container mx-auto flex items-center justify-between p-4">
          {/* Logo */}
          <div className="flex items-center gap-2 ml-16">
            <img src={TurnateLogo} alt="Logo" className="h-10" />
            <span className="font-bold text-xl bg-gradient-to-r from-white via-cyan-200 to-blue-300 text-transparent bg-clip-text">
              Turnate
            </span>
          </div>

          {/* Nav desktop */}
          <nav className="hidden md:flex gap-6 items-center">
            <Link
              to="/"
              className="text-white bg-gradient-to-r from-blue-600 to-cyan-400 border border-blue-500
                        hover:from-cyan-400 hover:to-blue-600 transition duration-300 ease-in-out focus:ring-4 focus:outline-none focus:ring-blue-300 
                        shadow-lg shadow-blue-500/50 font-medium rounded-lg text-sm px-5 py-2.5 
                        text-center me-2"
            >
              Home
            </Link>

            {user ? (
              <>
                <span className="text-white font-semibold">Hola, {user.rol}</span>
                <div className="relative items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
                  <button
                    type="button"
                    className="flex text-sm bg-gray-800 rounded-full md:me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                    aria-expanded={openDropdown}
                    onClick={() => setOpenDropdown(!openDropdown)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <img
                      className="w-8 h-8 rounded-full"
                      src="/docs/images/people/profile-picture-3.jpg"
                      alt="user photo"
                    />
                  </button>

                  {openDropdown && (
                    <div className="absolute z-50 my-4 right-0 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow-sm dark:bg-gray-700 dark:divide-gray-600">
                      <div className="px-4 py-3">
                    
                        <span className="block text-sm text-gray-500 truncate dark:text-gray-400">
                          Hola, {user?.rol || user?.username || "Usuario"}
                        </span>
                      </div>
                      <ul className="py-2" aria-labelledby="user-menu-button">
                        
                        <li>
                          <Link
                            to={`/profile/`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                          >
                            Panel de control
                          </Link>
                        </li>
                        
                        <li>
                          <button
                            onClick={handleLogout}
                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                          >
                            Cerrar Sesion
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white bg-gradient-to-r from-blue-600 to-cyan-400 border border-blue-500
                        hover:from-cyan-400 hover:to-blue-600 transition duration-300 ease-in-out focus:ring-4 focus:outline-none focus:ring-blue-300 
                        shadow-lg shadow-blue-500/50 font-medium rounded-lg text-sm px-5 py-2.5 
                        text-center me-2"
                >
                  Login
                </Link>

                <Link
                  to="/registro"
                  className="text-white bg-gradient-to-r from-blue-600 to-cyan-400 border border-blue-500
                        hover:from-cyan-400 hover:to-blue-600 transition duration-300 ease-in-out focus:ring-4 focus:outline-none focus:ring-blue-300 
                        shadow-lg shadow-blue-500/50 font-medium rounded-lg text-sm px-5 py-2.5 
                        text-center me-2"
                >
                  Registrarse
                </Link>
              </>
            )}
          </nav>

          {/* Botón hamburguesa (mobile) */}
          <div className="md:hidden">
            <button onClick={() => setOpen(!open)} className="focus:outline-none">
              <svg
                className="w-12 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden bg-white shadow">
            <ul className="flex flex-col gap-4 p-4">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/registro">Registrarse</Link>
              </li>
            </ul>
          </div>
        )}
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 pt-20 p-6">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="mx-auto w-full max-w-container px-4 sm:px-6 lg:px-8">
        <div className="border-t border-blue-800 py-10">
          <p className="mt-5 text-center text-sm leading-6 text-slate-500">
            © 2022 Tailwind Labs Inc. All rights reserved.
          </p>
          <div className="mt-8 flex items-center justify-center space-x-4 text-sm font-semibold leading-6 text-slate-700">
            <a href="/privacy-policy">Privacy policy</a>
            <div className="h-4 w-px bg-slate-500/20"></div>
            <a href="/changelog">Changelog</a>
          </div>
        </div>
      </footer>
    </div>
  );
}