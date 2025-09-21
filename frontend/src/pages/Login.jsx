import React from "react";
import axios from "axios";
import { useState } from "react";
import Loader from "../components/Loader";
import MensajeCreado from "../components/MensajeCreado";
import Input from "../components/Input";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { useContext } from "react";




export const Login = () => {
  const { login } = useContext(UserContext);
  const navigate = useNavigate(); // ✅ así definís navigate
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rol: "cliente", // 👈 valor por defecto
  });

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }
  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);

  try {
    const res = await axios.post("http://127.0.0.1:8000/usuarios/login/", formData);
    console.log("Respuesta backend login:", res.data);

    login({
      username: formData.username, // o res.data.user_schema.email
      email: res.data.user_schema.email,
      accessToken: res.data.token,
      refreshToken: res.data.token,
      rol: res.data.user_schema.rol || "cliente",
    });

    navigate("/");

  } catch (err) {
    setError("Email o contraseña incorrecto.");
    console.error(err);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <>
    {isLoading && <Loader />}
      {!isLoading &&(
    <div className="h-screen w-screen flex justify-center items-center dark:bg-white   font-poppins">
      <div className="grid gap-8 mb-8">
        <div
          id="back-div"
          className="bg-gradient-to-r from-blue-600 to-cyan-400 rounded-[26px] m-4"
        >
          <div className="border-[20px] border-transparent  rounded-[20px]  dark:bg-white bg-white shadow-lg xl:p-10 2xl:p-10 lg:p-10 md:p-10 sm:p-2 m-2">
            <h1 className="pt-8 pb-6 font-bold dark:text-black text-5xl text-center cursor-default">
              Iniciar Sesion
            </h1>
            <form onSubmit={handleSubmit} method="post" className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 dark:text-black text-lg  "
                >
                  Usuario
                </label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="border p-3 dark:bg-white dark:text-gray-700 dark:border-gray-800 shadow-md placeholder:text-base focus:scale-105 ease-in-out duration-300 border-blue-800 rounded-lg w-full"
                  type="text"
                  placeholder="Usuario123"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 dark:text-black text-lg"
                >
                  Contraseña
                </label>
                <Input
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="border p-3 shadow-md dark:bg-white dark:text-gray-800 dark:border-gray-700 placeholder:text-base focus:scale-105 ease-in-out duration-300 border-gray-300 rounded-lg w-full"
                  type="password"
                  placeholder="Contraseña123"
                  required
                />
              </div>
              <a
                className="group text-blue-400 transition-all duration-100 ease-in-out"
                href="#"
              >
                <span className="bg-left-bottom bg-gradient-to-r text-sm from-blue-400 to-blue-400 bg-[length:0%_2px] bg-no-repeat group-hover:bg-[length:100%_2px] transition-all duration-500 ease-out">
                  ¿Olvidaste tu contraseña?
                </span>
              </a>
              <button
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-cyan-400 shadow-lg mt-6 p-2 text-white rounded-lg w-full hover:scale-105 hover:from-cyan-400 hover:to-blue-600 transition duration-300 ease-in-out"
                type="submit"
              >
                Iniciar Sesion
              </button>
              {error && (
                    <div className="font-sans bg-red-600 text-white border border-red-900 rounded-lg p-4 mb-4">
                      {error}
                    </div>
                  )}
            </form>

            <div className="flex flex-col mt-4 items-center justify-center text-sm">
              <h3 className="dark:text-gray-800">
                No tienes una cuenta?{" "}
                <a
                  className="group text-blue-400 transition-all duration-100 ease-in-out"
                  href="#"
                >
                  <span className="bg-left-bottom bg-gradient-to-r from-blue-400 to-blue-400 bg-[length:0%_2px] bg-no-repeat group-hover:bg-[length:100%_2px] transition-all duration-500 ease-out">
                    Sign Up
                  </span>
                </a>
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
      )
    }
    </>
  );
};

