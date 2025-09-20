import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedEmail = localStorage.getItem("email"); // <-- nuevo
    const token = localStorage.getItem("accessToken");
    if (storedUsername && token) {
      setUser({ username: storedUsername, email: storedEmail });
    }
  }, []);

  const login = (userData) => {
    localStorage.setItem("username", userData.username);
    localStorage.setItem("email", userData.email); // <-- nuevo
    localStorage.setItem("accessToken", userData.accessToken);
    localStorage.setItem("refreshToken", userData.refreshToken);
    setUser({ username: userData.username, email: userData.email });
  };

  const logout = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/api/logout/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("email"); // <-- nuevo
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};