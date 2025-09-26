import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Cargar usuario desde localStorage al iniciar la app
  useEffect(() => {
    const id = localStorage.getItem("id");
    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");
    const rol = localStorage.getItem("rol");
    const accessToken = localStorage.getItem("accessToken");
    const emprendimiento_id = localStorage.getItem("emprendimiento_id"); // opcional

    if (id && username && email && rol && accessToken) {
      setUser({
        id,
        username,
        email,
        rol,
        emprendimiento_id: emprendimiento_id || null, // ✅ null si no existe
      });
    }
  }, []);

  const login = (userData) => {
    console.log("Respuesta backend login:", userData);
    const {
      id,
      username,
      email,
      rol,
      accessToken,
      refreshToken,
      emprendimiento_id,
    } = userData;

    // Guardar en localStorage
    localStorage.setItem("id", id);
    localStorage.setItem("username", username);
    localStorage.setItem("email", email);
    localStorage.setItem("rol", rol);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    console.log(localStorage.getItem("emprendimiento_id"));
    localStorage.getItem("emprendimiento_id")

    if (emprendimiento_id) {
      localStorage.setItem("emprendimiento_id", emprendimiento_id); // opcional
    }

    // Guardar en contexto
    setUser({
      id,
      username,
      email,
      rol,
      emprendimiento_id: emprendimiento_id || null, // opcional
    });
  };

  const logout = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/api/logout/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }

    localStorage.removeItem("id");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("rol");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("emprendimiento_id"); // opcional

    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
