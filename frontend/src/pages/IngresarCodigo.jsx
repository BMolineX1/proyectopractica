import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function IngresarCodigo() {
  const [codigo, setCodigo] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!codigo) return alert("Ingresa un código válido");

    try {
      // Verificar con el backend si existe el emprendedor
      const res = await axios.get(`http://localhost:8000/emprendedores/${codigo}`);

      if (res.data) {
        // ✅ Existe → redirigir a la página de turnos
        navigate(`/reservar/${codigo}`);
      }
    } catch (err) {
      // ❌ No existe el emprendedor
      alert("El código ingresado no corresponde a ningún emprendedor.");
    }
  };

  return (
    <div className="relative h-[700px] bg-gradient-to-r from-blue-600 to-cyan-500 ">
      <div className="flex flex-col gap-4 justify-center items-center w-full h-full px-2 md:px-2">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
          Reservar Turno
        </h1>
        <p className="text-gray-100">
          Ingresa el código que te proporcionó el emprendedor
        </p>

        <form
          onSubmit={handleSubmit}
          className="relative border border-white rounded-lg w-full max-w-lg"
        >
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="rounded-md border border-blue-400 hover:border-blue-700 text-white  w-full p-3"
            placeholder="Ingrese el código"
          />

          <button
            type="submit"
            className="absolute right-6 top-3 text-blue-700 hover:text-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}