
import './App.css'
import { useEffect, useState } from 'react'
import Login from './vistas/login/Login.jsx'
import Registro from './vistas/registro/Registro.jsx'
import Home from './vistas/home/Home.jsx'
import Navbar from './componentes/navbar/Navbar.jsx'
import Footer from './componentes/footer/Footer.jsx'
import axios from './axiosApi'

function App() {
  // Home es pública: no hace falta iniciar sesión para entrar.
  const [vista, setVista] = useState('home')
  const [usuario, setUsuario] = useState(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)

  // Recuperar la sesión al abrir o actualizar la página.
  useEffect(() => {
    let activo = true

    axios.get('/auth/miusuario')
      .then(({ data }) => {
        if (activo) {
          setUsuario(data.usuario ?? null)
        }
      })
      .catch(() => {
        if (activo) {
          setUsuario(null)
        }
      })
      .finally(() => {
        if (activo) {
          setCargandoSesion(false)
        }
      })

    return () => {
      activo = false
    }
  }, [])

  // Se ejecuta después de un login exitoso.
  async function manejarLogin() {
    try {
      const { data } = await axios.get('/auth/miusuario')

      setUsuario(data.usuario ?? null)
      setVista('home')
    } catch (error) {
      console.error(
        'No se pudieron recuperar los datos del usuario:',
        error
      )

      setUsuario(null)

      alert(
        'Se inició sesión, pero no se pudieron recuperar los datos del usuario. Volvé a intentarlo.'
      )
    }
  }

  // Cerrar la sesión en el backend y volver a Home.
  async function manejarLogout() {
    try {
      await axios.post('/auth/logout')
    } catch (error) {
      console.error('Error al cerrar la sesión:', error)
    } finally {
      setUsuario(null)
      setVista('home')
    }
  }

  const mostrarSitio = vista === 'home'

  // Evitar mostrar la interfaz antes de comprobar la sesión.
  if (cargandoSesion) {
    return (
      <div className="solverank-cargando">
        Cargando Solverank...
      </div>
    )
  }

  return (
    <div>
      {mostrarSitio && (
        <Navbar
          vistaActiva={vista}
          usuario={usuario}
          onInicio={() => setVista('home')}
          onIniciarSesion={() => setVista('login')}
          onCerrarSesion={manejarLogout}
        />
      )}

      {vista === 'home'
        ? <Home />
        : vista === 'registro'
        ? (
            <Registro
                onRegistroExitoso={manejarLogin}
                onVolverLogin={() => setVista('login')}
            />
        ) : (
            <Login
              onRegister={() => setVista('registro')}
              onLogin={manejarLogin}
            />
          )}

      {mostrarSitio && <Footer />}
    </div>
  )
}

export default App
