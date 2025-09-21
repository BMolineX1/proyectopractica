
import './App.css'
import {  BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Layout from './pages/Layout'
import {Login} from './pages/Login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'
import UpdateUserForm from "./pages/UpdateUserForm";
import IngresarCodigo from './pages/IngresarCodigo'
import Turnos from './pages/Turnos'
function App() {

  return (

    <Routes>
        <Route path='/' element={<Layout/>}>
        <Route index element={<Home/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/registro' element={<Registro/>}/>
        <Route path='/profile' element={<Dashboard/>}/>
        <Route path='/editarusuario' element={<UpdateUserForm/>}/>
        <Route path='/ingresarcodigo' element={<IngresarCodigo/>}/>
        <Route path='/Turnos' element={<Turnos/>}/>
        {/*<Route path="/reservar/:codigo" element={<ReservarTurno />} />*/}
      </Route>

    </Routes>
    
  )
}

export default App
