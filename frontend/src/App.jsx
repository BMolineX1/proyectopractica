import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Layout from './pages/Layout'
import {Login} from './pages/Login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'
import UpdateUserForm from "./pages/UpdateUserForm";
import IngresarCodigo from './pages/IngresarCodigo'
import Turnos from './pages/Turnos'
import Nosotros from "./pages/Nosotros";
import Privacidad from "./pages/Privacidad";
import Terminos from "./pages/Terminos";

function App() {
  return (
    <Routes>
      <Route path='/' element={<Layout/>}>
        <Route index element={<Home/>} />

        {/* Auth */}
        <Route path='/login' element={<Login/>} />
        <Route path='/registro' element={<Registro/>} />
        <Route path='/profile' element={<Dashboard/>} />
        <Route path='/editarusuario' element={<UpdateUserForm/>} />

        {/* Reservar */}
        {/* NUEVA: base /reservar para el form de código */}
        <Route path='/reservar' element={<IngresarCodigo/>} />
        {/* Ya tenías: reservar con código */}
        <Route path='/reservar/:codigo' element={<Turnos/>} />

        {/* Panel emprendedor (nuevo alias para el botón del navbar) */}
        <Route path='/emprendedor' element={<Dashboard/>} />

        {/* Turnos (normalizamos y damos alias) */}
        <Route path='/turnos' element={<Turnos/>} />
        <Route path='/Turnos' element={<Navigate to="/turnos" replace />} />

        {/* Páginas estáticas */}
        <Route path='/nosotros' element={<Nosotros/>} />
        <Route path='/privacidad' element={<Privacidad/>} />
        <Route path='/terminos' element={<Terminos/>} />

        {/* Ingresar código (tu ruta existente) */}
        <Route path='/ingresarcodigo' element={<IngresarCodigo/>} />

        {/* 404 */}
        <Route path='*' element={<div className="p-6">404 — Página no encontrada</div>} />
      </Route>
    </Routes>
  )
}

export default App
