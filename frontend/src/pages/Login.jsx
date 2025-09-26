import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../components/api";
import { UserContext } from "../context/UserContext";
import Loader from "../components/Loader";
import Input from "../components/Input";

export const Login = () => {
  const { login } = useContext(UserContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rol: "cliente",
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post("/usuarios/login", formData);
      console.log("Respuesta backend login:", res.data);

      const userBackend = res.data.user_schema;

      // Guardar usuario con ID correcto
      login({
        id: userBackend.id,
        username: formData.username,
        email: userBackend.email,
        rol: userBackend.rol || "cliente",
        accessToken: res.data.token,
        refreshToken: res.data.token,
      });

      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Usuario o contraseña incorrectos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <Loader />}
      {!isLoading && (
        <div className="h-screen w-screen flex justify-center items-center font-poppins">
          <div className="grid gap-8 mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-400 rounded-[26px] m-4">
              <div className="border-[20px] border-transparent rounded-[20px] bg-white shadow-lg p-10 m-2">
                <h1 className="pt-8 pb-6 font-bold text-5xl text-center">
                  Iniciar Sesión
                </h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="username" className="mb-2 text-lg">
                      Usuario
                    </label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      type="text"
                      placeholder="Usuario123"
                      required
                      className="border p-3 rounded-lg w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="mb-2 text-lg">
                      Contraseña
                    </label>
                    <Input
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      type="password"
                      placeholder="Contraseña123"
                      required
                      className="border p-3 rounded-lg w-full"
                    />
                  </div>
                  <button
                    disabled={isLoading}
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-cyan-400 mt-6 p-2 text-white rounded-lg w-full"
                  >
                    Iniciar Sesión
                  </button>
                  {error && (
                    <div className="bg-red-600 text-white p-4 rounded-lg mt-2">
                      {error}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
