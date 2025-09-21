// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000", // Cambia al puerto donde corre tu FastAPI
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;