// src/pages/Dashboard.jsx
import React, { useContext, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faBell, faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import UpdateUserForm from "./UpdateUserForm";
import EmprendedorForm from "./EmprendedorForm";
import CardPlan from "./CardPlan";
import Estadisticas from "./Estadisticas";
import Turnos from "./Turnos";
import { UserContext } from "../context/UserContext";
import Loader from "../components/Loader";

export default function Dashboard() {
  const { user, login } = useContext(UserContext);
  const [activeComponent, setActiveComponent] = useState(null);
  const navigate = useNavigate();
  if (!user) return <Loader />;
  const handleActivateEmprendedor = () => {
    login({ ...user, rol: "emprendedor" });
    setActiveComponent("emprendedor");
  };

  return (
    <div className="bg-gray-100 min-h-screen flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-cordes-dark shadow-xl z-20 mt-10">
        <nav className="mt-8 px-4 pb-8 bg-gradient-to-b from-blue-600 to-cyan-400 border border-blue-500 rounded-lg">
          {/* Botón Editar Perfil */}
          <Button onClick={() => setActiveComponent("perfil")}>
            <i className="fa-solid fa-gear mr-2"></i>Editar Perfil <FontAwesomeIcon icon={faGear} />
          </Button>

          {/* Botón Agregar Emprendimiento */}
          <Button onClick={() => {
            if (user?.rol === "cliente") {
              setActiveComponent("cardplan");
            } else {
              setActiveComponent("emprendedor");
            }
          }}>
            Agregar Emprendimiento
          </Button>

          {/* Botón Turnos solo si es emprendedor */}
          {user?.rol === "emprendedor" && (
            <Button onClick={() => setActiveComponent("turnos")}>
              <i className="fa-solid fa-calendar-days mr-2"></i>Turnos <FontAwesomeIcon icon={faCalendarDays} />
            </Button>
          )}

          {/* Botón Estadísticas */}
          <Button onClick={() => setActiveComponent("estadisticas")}>
            <i className="fa-solid fa-gear mr-2"></i>Estadísticas <FontAwesomeIcon icon={faGear} />
          </Button>
        </nav>

        {/* Info de usuario abajo */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-800 rounded-lg p-4 flex items-center space-x-3">
            <img
              src="https://cdn-icons-png.flaticon.com/512/17003/17003310.png"
              alt="User"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="text-white text-sm font-medium">{user?.username || "Usuario"}</p>
              <p className="text-gray-400 text-xs">{user?.rol || "Cliente"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 flex-1 p-6">
        {/* Header */}
      

        {/* Contenido principal */}
        <div>
          {activeComponent === "perfil" && <UpdateUserForm />}
          {activeComponent === "estadisticas" && <Estadisticas />}
          {activeComponent === "cardplan" && user.rol === "cliente" && (
            <CardPlan user={user} onActivate={handleActivateEmprendedor} />
          )}
          {activeComponent === "emprendedor" && <EmprendedorForm />}
          {activeComponent === "turnos" && <Turnos />}
        </div>
      </div>
    </div>
  );
}