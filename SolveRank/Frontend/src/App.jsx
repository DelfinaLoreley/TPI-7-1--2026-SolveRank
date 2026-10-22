
import './App.css'
import { useEffect, useState } from 'react'
import Login from './vistas/login/Login.jsx'
import Registro from './vistas/registro/Registro.jsx'
import CompletarRegistro from './vistas/registro/CompletarRegistro.jsx'
import Home from './vistas/home/Home.jsx'
import PanelPrincipal from './vistas/Organizador/PanelPrincipal.jsx'
import CreacionTorneo from './vistas/torneos/CreacionTorneo.jsx'
import TorneoDetalle from './vistas/torneos/TorneoDetalle.jsx'
import ListadoTorneo from './vistas/torneos/ListadoTorneo.jsx'
import Rankings from './vistas/rankings/Rankings.jsx'
import Records from './vistas/records/Records.jsx'
import MisTorneos from './vistas/torneos/MisTorneos.jsx'
import GestionRoles from './vistas/admin/GestionRoles.jsx'
import MiPerfil from './vistas/perfil/MiPerfil.jsx'
import InfoExtraTorneo from './vistas/torneos/InfoExtraTorneo.jsx'
import Navbar from './componentes/navbar/Navbar.jsx'
import Footer from './componentes/footer/Footer.jsx'
import axios from './axiosApi'

function App() {
  // Home es pública: no hace falta iniciar sesión para entrar.
  const esVistaInfoExtra = new URLSearchParams(window.location.search).get('vista') === 'info-extra-torneo'
  const [vista, setVista] = useState(esVistaInfoExtra ? 'info-extra-torneo' : 'home')
  const [usuario, setUsuario] = useState(null)
  const [torneoSeleccionado, setTorneoSeleccionado] = useState(null)
  const [volverDetalleA, setVolverDetalleA] = useState('home')
  const [cargandoSesion, setCargandoSesion] = useState(true)

  function abrirDetalleTorneo(torneo, volverA = 'home') {
    setTorneoSeleccionado(torneo)
    setVolverDetalleA(volverA)
    setVista('detalle-torneo')
  }

  // Recuperar la sesión al abrir o actualizar la página.
  useEffect(() => {
    let activo = true

    axios.get('/auth/miusuario')
      .then(({ data }) => {
        if (activo) {
          setUsuario(data.usuario ?? null)
          if (!esVistaInfoExtra) {
            if (data.usuario?.perfilCompleto === false) {
              setVista('completar-registro-google')
            } else if (data.usuario?.rol === 'Organizador') {
              setVista('panel-organizador')
            }
          }
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
      setVista(data.usuario?.perfilCompleto === false
        ? 'completar-registro-google'
        : data.usuario?.rol === 'Organizador'
        ? 'panel-organizador'
        : 'home')
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

  async function manejarPerfilGoogleCompletado() {
    try {
      const { data } = await axios.get('/auth/miusuario')
      setUsuario(data.usuario ?? null)
      setVista('home')
      window.history.replaceState({}, document.title, window.location.pathname)
    } catch (error) {
      console.error('No se pudo actualizar la sesión:', error)
      alert('Se guardó el perfil, pero no se pudieron recuperar tus datos. Actualizá la página.')
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

  const mostrarSitio = vista === 'home' || vista === 'rankings' || vista === 'records' || vista === 'mis-torneos' || vista === 'panel-organizador' || vista === 'crear-torneo' || vista === 'detalle-torneo' || vista === 'listado-torneos' || vista === 'gestion-roles' || vista === 'mi-perfil'

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
          onTorneos={() => setVista('listado-torneos')}
          onMisTorneos={() => setVista('mis-torneos')}
          onRankings={() => setVista('rankings')}
          onRecords={() => setVista('records')}
          onPanelOrganizador={() => {
            if (usuario?.rol === 'Organizador') setVista('panel-organizador')
          }}
          onGestionRoles={() => {
            if (usuario?.rol === 'Administrador') setVista('gestion-roles')
          }}
          onMiPerfil={() => {
            if (usuario) setVista('mi-perfil')
          }}
          onIniciarSesion={() => setVista('login')}
          onCerrarSesion={manejarLogout}
        />
      )}

      {vista === 'home'
        ? <Home usuario={usuario} onIniciarSesion={() => setVista('login')} onVerTorneo={(torneo) => abrirDetalleTorneo(torneo, 'home')} onVerTodosTorneos={() => setVista('listado-torneos')} onVerRankings={() => setVista('rankings')} />
        : vista === 'rankings'
        ? <Rankings usuario={usuario} />
        : vista === 'records'
        ? <Records />
        : vista === 'mis-torneos'
        ? ['Competidor', 'Juez', 'Delegado', 'Organizador'].includes(usuario?.rol)
          ? <MisTorneos usuario={usuario} onVerTorneo={(torneo) => abrirDetalleTorneo(torneo, 'mis-torneos')} onVerTodosTorneos={() => setVista('listado-torneos')} />
          : <Home usuario={usuario} onIniciarSesion={() => setVista('login')} onVerRankings={() => setVista('rankings')} />
        : vista === 'listado-torneos'
        ? <ListadoTorneo usuario={usuario} onIniciarSesion={() => setVista('login')} onVerTorneo={(torneo) => abrirDetalleTorneo(torneo, 'listado-torneos')} />
        : vista === 'panel-organizador'
        ? usuario?.rol === 'Organizador'
          ? <PanelPrincipal
              usuario={usuario}
              onCrearTorneo={() => setVista('crear-torneo')}
              onVerTorneo={(torneo) => abrirDetalleTorneo(torneo, 'panel-organizador')}
            />
          : <Home />
        : vista === 'gestion-roles'
        ? usuario?.rol === 'Administrador'
          ? <GestionRoles usuario={usuario} onVolver={() => setVista('home')} />
          : <Home usuario={usuario} onIniciarSesion={() => setVista('login')} />
        : vista === 'mi-perfil'
        ? usuario
          ? <MiPerfil onVolver={() => setVista('home')} onPerfilActualizado={async () => {
              const { data } = await axios.get('/auth/miusuario')
              setUsuario(data.usuario ?? null)
            }} />
          : <Home usuario={usuario} onIniciarSesion={() => setVista('login')} />
        : vista === 'detalle-torneo'
        ? <TorneoDetalle
            idTorneo={torneoSeleccionado?.idTorneo}
            usuario={usuario}
            onSalir={() => setVista(volverDetalleA)}
          />
        : vista === 'info-extra-torneo'
        ? <InfoExtraTorneo />
        : vista === 'crear-torneo'
        ? usuario?.rol === 'Organizador'
          ? <CreacionTorneo usuario={usuario} onSalir={() => setVista('panel-organizador')} onPublicar={async (datos) => {
              await axios.post('/torneos', datos)
              setVista('panel-organizador')
            }} />
          : <Home />
        : vista === 'completar-registro-google'
        ? <CompletarRegistro onCompletado={manejarPerfilGoogleCompletado} />
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
