import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Cargar usuario desde localStorage al iniciar la app
  useEffect(() => {
    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");
    const rol = localStorage.getItem("rol");
    const accessToken = localStorage.getItem("accessToken");

    if (username && email && rol && accessToken) {
      setUser({ username, email, rol });
    }
  }, []);

  const login = (userData) => {
    console.log("Respuesta backend login:", userData);
    const { username, email, rol, accessToken, refreshToken } = userData;

    localStorage.setItem("username", username);
    localStorage.setItem("email", email);
    localStorage.setItem("rol", rol);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    setUser({ username, email, rol });
  };

  const logout = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/api/logout/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }

    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("rol");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};