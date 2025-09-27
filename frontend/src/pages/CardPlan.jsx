// src/components/CardPlan.jsx
import React, { useContext } from "react";
import { UserContext } from "../context/UserContext";
import api from "../components/api";

export default function CardPlan() {
  const { user, setUser } = useContext(UserContext);

  // Si el usuario ya es emprendedor, no mostrar la tarjeta
  if (user?.rol === "emprendedor") return null;

  const handleActivate = async () => {
    try {
      console.log("Simulando pago y activando rol de emprendedor...");

      // Usamos la instancia api (tiene el Authorization por interceptor)
      const res = await api.put(`/usuarios/${user?.id}/activar_emprendedor`);

      // 🔁 Backend devuelve { user, token }
      const { user: userServer, token } = res.data || {};

      // Guardar token nuevo (ya con rol actualizado) en localStorage
      if (token) {
        localStorage.setItem("accessToken", token);
      }

      // Usar user del backend o fallback al user actual con rol "emprendedor"
      const updatedUser = userServer || { ...user, rol: "emprendedor" };
      localStorage.setItem("rol", updatedUser.rol);

      // Actualizar el contexto
      setUser((prev) => ({
        ...prev,
        ...updatedUser,
      }));

      console.log("Rol de emprendedor activado:", updatedUser);
      alert("¡Listo! Tu cuenta ahora es de emprendedor.");
    } catch (error) {
      console.error("Error activando rol de emprendedor:", error);
      const msg =
        error?.response?.data?.detail ||
        "No se pudo activar el rol. Revisá la consola para más info.";
      alert(msg);
    }
  };

  return (
    <div className="relative py-6 md:mr-8 px-8 rounded-lg bg-gray-100 w-full md:w-6/12 mt-6 md:mb-0">
      <div className="flex justify-between">
        <div className="w-full">
          <div className="text-blue-900 text-lg font-medium mb-2">Lifetime</div>
          <div className="text-gray-700 text-sm leading-tight">
            Accede a tu agenda de turnos digital a solo:
          </div>
        </div>
        <div className="text-gray-800 text-4xl leading-none text-right">
          14000$
          <span className="ml-1 text-gray-500 text-base">/once</span>
        </div>
      </div>

      <div className="border-b border-gray-300 w-full mt-6 mb-8"></div>

      <ul className="mb-10">
        <li className="flex items-center gap-1 text-blue-900 text-sm font-medium mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 shrink-0"
            viewBox="0 0 24 24"
          >
            <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm5.676,8.237-6,5.5a1,1,0,0,1-1.383-.03l-3-3a1,1,0,1,1,1.414-1.414l2.323,2.323,5.294-4.853a1,1,0,1,1,1.352,1.474Z" />
          </svg>
          <span>One payment, access forever</span>
        </li>

        <li className="flex items-center gap-1 text-blue-900 text-sm font-medium mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 shrink-0"
            viewBox="0 0 24 24"
          >
            <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm5.676,8.237-6,5.5a1,1,0,0,1-1.383-.03l-3-3a1,1,0,1,1,1.414-1.414l2.323,2.323,5.294-4.853a1,1,0,1,1,1.352,1.474Z" />
          </svg>
          <span>All features and benefits</span>
        </li>
      </ul>

      <button
        className="inline-flex items-center justify-center bg-blue-400 text-white h-10 px-5 rounded-lg text-sm font-medium w-full hover:bg-blue-500"
        onClick={handleActivate}
      >
        Get started
      </button>
    </div>
  );
}
