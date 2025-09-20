import React, { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import Button from "../components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faBell, faCalendarDays  } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import UpdateUserForm from "./UpdateUserForm";


Chart.register(...registerables);

export default function Dashboard() {


  const [showForm, setShowForm] = useState(false);

  const navigate = useNavigate();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      // Destruir chart previo si existe
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      chartInstance.current = new Chart(chartRef.current, {
        type: "line",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          datasets: [
            {
              label: "Revenue",
              data: [1200, 1900, 3000, 2500, 3200, 4000],
              borderColor: "#1e40af",
              backgroundColor: "rgba(30, 64, 175, 0.2)",
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
        },
      });
    }

    // Cleanup al desmontar
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-cordes-dark shadow-xl z-20 mt-10">
        

        <nav className="mt-8 px-4 pb-8  bg-gradient-to-b from-blue-600 to-cyan-400 border border-blue-500 rounded-lg">
          {/* Botón especial Editar Perfil */}
          <Button onClick={() => setShowForm(!showForm)}>
            <i  className="fa-solid fa-gear mr-2"></i>Editar Perfil <FontAwesomeIcon icon={faGear} /> 
          </Button>
          <Button onClick={() => console.log("Ir a editar perfil")}>
            <i  className="fa-solid fa-gear mr-2"></i>Turnos <FontAwesomeIcon icon={faCalendarDays} /> 
          </Button>
          <Button onClick={() => console.log("Ir a editar perfil")}>
            <i  className="fa-solid fa-gear mr-2"></i>Horarios <FontAwesomeIcon icon={faGear} /> 
          </Button>
          <i class="fa-solid fa-gear"></i>
          
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-800 rounded-lg p-4 flex items-center space-x-3">
            <img
              src="https://cdn-icons-png.flaticon.com/512/17003/17003310.png"
              alt="Admin"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="text-white text-sm font-medium">John Admin</p>
              <p className="text-gray-400 text-xs">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}

      <div className="ml-64 flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Panel de Control
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Welcome back, here's what's happening today
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                <FontAwesomeIcon icon={faBell} className="text-xl" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">  3
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        {showForm ? (
          <div className="mt-6">
            <UpdateUserForm />
          </div>
        ) : (
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Revenue"
              value="$48,291"
              change="12%"
              icon="fa-dollar-sign"
              iconColor="text-cordes-blue"
              bgColor="bg-cordes-blue bg-opacity-10"
            />
            <StatCard
              title="Total Users"
              value="15,847"
              change="8%"
              icon="fa-users"
              iconColor="text-green-600"
              bgColor="bg-green-100"
            />
            <StatCard
              title="Total Orders"
              value="2,847"
              change="15%"
              icon="fa-shopping-cart"
              iconColor="text-orange-600"
              bgColor="bg-orange-100"
            />
            <StatCard
              title="Products"
              value="1,247"
              change="5%"
              icon="fa-box"
              iconColor="text-purple-600"
              bgColor="bg-purple-100"
            />
          </div>

          {/* Chart Example */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Revenue Analytics
            </h3>
            <canvas ref={chartRef}></canvas>
          </div>
        </main>

        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon, iconColor, bgColor }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <div className="flex items-center mt-2">
            <span className="text-green-600 text-sm font-medium flex items-center">
              <i className="fas fa-arrow-up mr-1"></i>
              {change}
            </span>
            <span className="text-gray-500 text-sm ml-2">vs last month</span>
          </div>
        </div>
        <div
          className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}
        >
          <i className={`fas ${icon} ${iconColor} text-xl`}></i>
        </div>
      </div>
    </div>
  );
}