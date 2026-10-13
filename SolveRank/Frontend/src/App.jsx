import './App.css'
import { useState } from 'react'
import Login from './vistas/login/Login.jsx'
import Registro from './vistas/registro/Registro.jsx'
import Home from './vistas/home/Home.jsx'
import Navbar from './componentes/navbar/Navbar.jsx'
import Footer from './componentes/footer/Footer.jsx'

function App() {
  const [vista, setVista] = useState('login')
  const usuarioAutenticado = vista !== 'login' && vista !== 'registro'

  return (
    <div>
      {usuarioAutenticado && (
        <Navbar
          vistaActiva={vista}
          onInicio={() => setVista('home')}
          onIniciarSesion={() => setVista('login')}
        />
      )}
      {vista === 'home'
        ? <Home />
        : vista === 'registro'
          ? <Registro />
          : <Login
              onRegister={() => setVista('registro')}
              onLogin={() => setVista('home')}
            />}
      {usuarioAutenticado && <Footer />}
    </div>
  )
}

export default App
