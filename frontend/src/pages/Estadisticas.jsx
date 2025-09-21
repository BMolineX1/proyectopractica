// src/pages/Estadisticas.jsx
import React, { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

// Componente reutilizable para tarjetas de estadísticas
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
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
          <i className={`fas ${icon} ${iconColor} text-xl`}></i>
        </div>
      </div>
    </div>
  );
}

export default function Estadisticas() {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy();

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

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, []);

  return (
    <div className="p-6">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analytics</h3>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}
