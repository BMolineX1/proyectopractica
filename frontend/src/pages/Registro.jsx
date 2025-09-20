import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Button from "../components/Button";
import Input from "../components/Input";
import Loader from "../components/Loader";
import MensajeCreado from "../components/MensajeCreado";

export default function Registro() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    rol: "cliente",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.post("http://127.0.0.1:8000/usuarios/registro/", formData);
      console.log("Usuario registrado correctamente:", response.data);

      // Mostrar éxito
      setSuccess(true);

      // Limpiar formulario
      setFormData({
        email: "",
        username: "",
        password: "",
        rol: "cliente",
      });

    } catch (err) {
      if (err.response && err.response.data) {
        // Mostrar primer error que venga del backend
        const firstError = Object.values(err.response.data).flat()[0];
        setError(firstError);
      } else {
        setError("Error al registrar al usuario.");
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <Loader />}
      {success && <MensajeCreado message="Usuario registrado con éxito!" />}
      
      {!isLoading && !success && (
        <div className="bg-white min-h-screen flex items-center justify-center p-4 font-['Inter']">
          <div className="w-full max-w-[800px] mb-20 bg-white border border-blue-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">

            {/* Left Section */}
            <div className="w-full md:w-1/2 relative">
              <div className="relative h-full mt-0">
                <img
                  src="./images/mujer-que-trabaja-oficina-casa.jpg"
                  alt="Logo"
                  className="w-auto h-auto object-contain"
                />
                <div className="absolute inset-0 bg-purple-900/30"></div>
                <div className="absolute bottom-12 left-12 text-white">
                  <h2 className="text-2xl md:text-3xl font-semibold">
                    Agrega a tu emprendimiento,
                  </h2>
                  <h2 className="text-2xl md:text-3xl pb-12 font-semibold">
                    para mayor control<br />en tus turnos
                  </h2>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="w-full md:w-1/2 p-6 md:p-12">
              <div className="max-w-md mx-auto">
                <h1 className="text-black text-2xl md:text-4xl font-semibold mb-2">
                  Crear una cuenta
                </h1>
                <p className="text-gray-800 mb-8">
                  Ya tienes una cuenta?{" "}
                  <a
                    className="group text-blue-400 transition-all duration-100 ease-in-out"
                    href="/login"
                  >
                    <span className="bg-left-bottom bg-gradient-to-r from-blue-400 to-blue-400 bg-[length:0%_2px] bg-no-repeat group-hover:bg-[length:100%_2px] transition-all duration-500 ease-out">
                      Login
                    </span>
                  </a>
                </p>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <label className="text-2xl">Correo Electrónico</label>
                  <Input
                    type="email"
                    placeholder="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white border border-blue-900 text-black rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />

                  <label className="text-2xl">Nombre de Usuario</label>
                  <Input
                    type="text"
                    placeholder="Usuario"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full bg-white border border-blue-900 text-black rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />

                  <label className="text-2xl">Contraseña</label>
                  <Input
                    type="password"
                    placeholder="Contraseña"
                    name="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-white border border-blue-900 text-black rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />

                  <input
                    type="hidden"
                    name="rol"
                    value={formData.cliente}
                  />

                  {error && (
                    <div className="font-sans bg-red-600 text-white border border-red-900 rounded-lg p-4 mb-4">
                      {error}
                    </div>
                  )}

                  <Button type="submit" disabled={isLoading} className="w-full mt-8">
                    <p className="text-2xl">Registrarse</p>
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}