
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
import PreguntasFrecuentes from './vistas/preguntasFrecuentes/PreguntasFrecuentes.jsx'
import ReglamentoOficial from './vistas/reglamentoOficial/ReglamentoOficial.jsx'
import PaginaNoEncontrada from './vistas/error404/PaginaNoEncontrada.jsx'
import SolveRankLive from './vistas/live/SolveRankLive.jsx'
import DetalleTorneoLive from './vistas/live/DetalleTorneoLive.jsx'
import Navbar from './componentes/navbar/Navbar.jsx'
import Footer from './componentes/footer/Footer.jsx'
import axios from './axiosApi'

function App() {
  // Home es pública: no hace falta iniciar sesión para entrar.
  const rutaInicial = window.location.pathname.replace(/\/+$/, '') || '/'
  const rutaConocida = rutaInicial === '/' || rutaInicial === '/index.html'
  const vistaExtra = new URLSearchParams(window.location.search).get('vista')
  const esVistaInfoExtra = rutaConocida && vistaExtra === 'info-extra-torneo'
  const esVistaPreguntasFrecuentes = rutaConocida && vistaExtra === 'preguntas-frecuentes'
  const esVistaReglamentoOficial = rutaConocida && vistaExtra === 'reglas-oficiales'
  const [vista, setVista] = useState(esVistaInfoExtra ? 'info-extra-torneo' : esVistaPreguntasFrecuentes ? 'preguntas-frecuentes' : esVistaReglamentoOficial ? 'reglas-oficiales' : rutaConocida ? 'home' : 'pagina-no-encontrada')
  const [usuario, setUsuario] = useState(null)
  const [torneoSeleccionado, setTorneoSeleccionado] = useState(null)
  const [perfilSeleccionadoId, setPerfilSeleccionadoId] = useState(null)
  const [volverDetalleA, setVolverDetalleA] = useState('home')
  const [seccionMisTorneos, setSeccionMisTorneos] = useState(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)

  function abrirMisTorneos(seccion = null) {
    setSeccionMisTorneos(seccion)
    setVista('mis-torneos')
  }

  function abrirDetalleTorneo(torneo, volverA = 'home') {
    setTorneoSeleccionado(torneo)
    setVolverDetalleA(volverA)
    setVista('detalle-torneo')
  }

  function abrirDetalleTorneoLive(torneo) {
    setTorneoSeleccionado(torneo)
    setVista('detalle-torneo-live')
  }

  // Recuperar la sesión al abrir o actualizar la página.
  useEffect(() => {
    let activo = true

    axios.get('/auth/miusuario')
      .then(({ data }) => {
        if (activo) {
          setUsuario(data.usuario ?? null)
          if (!esVistaInfoExtra && !esVistaPreguntasFrecuentes && !esVistaReglamentoOficial && rutaConocida) {
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
  }, [esVistaInfoExtra, esVistaPreguntasFrecuentes, esVistaReglamentoOficial, rutaConocida])

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

  const mostrarSitio = vista === 'home' || vista === 'rankings' || vista === 'records' || vista === 'mis-torneos' || vista === 'panel-organizador' || vista === 'crear-torneo' || vista === 'detalle-torneo' || vista === 'detalle-torneo-live' || vista === 'listado-torneos' || vista === 'gestion-roles' || vista === 'mi-perfil' || vista === 'perfil-publico' || vista === 'live' || vista === 'pagina-no-encontrada' || vista === 'preguntas-frecuentes' || vista === 'reglas-oficiales'

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
          vistaActiva={vista === 'detalle-torneo-live' ? 'live' : vista}
          usuario={usuario}
          onInicio={() => setVista('home')}
          onTorneos={() => setVista('listado-torneos')}
          onMisTorneos={() => abrirMisTorneos()}
          onRankings={() => setVista('rankings')}
          onRecords={() => setVista('records')}
          onLive={() => setVista('live')}
          onPanelOrganizador={() => {
            if (usuario?.rol === 'Organizador') setVista('panel-organizador')
          }}
          onGestionRoles={() => {
            if (usuario?.rol === 'Administrador') setVista('gestion-roles')
          }}
          onMiPerfil={() => {
            if (usuario) setVista('mi-perfil')
          }}
          onBuscarTorneo={(torneo) => abrirDetalleTorneo(torneo, 'home')}
          onBuscarCompetidor={(competidor) => {
            setPerfilSeleccionadoId(competidor.idUsuario)
            setVista('perfil-publico')
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
        : vista === 'live'
        ? <SolveRankLive onVerTorneo={abrirDetalleTorneoLive} />
        : vista === 'detalle-torneo-live'
        ? <DetalleTorneoLive key={torneoSeleccionado?.idTorneo} torneoSeleccionado={torneoSeleccionado} onSalir={() => setVista('live')} />
        : vista === 'mis-torneos'
        ? ['Competidor', 'Juez', 'Delegado', 'Organizador'].includes(usuario?.rol)
          ? <MisTorneos usuario={usuario} seccionOrganizador={seccionMisTorneos} onVerTorneo={(torneo) => abrirDetalleTorneo(torneo, 'mis-torneos')} onVerTodosTorneos={() => setVista('listado-torneos')} />
          : <Home usuario={usuario} onIniciarSesion={() => setVista('login')} onVerRankings={() => setVista('rankings')} />
        : vista === 'listado-torneos'
        ? <ListadoTorneo usuario={usuario} onIniciarSesion={() => setVista('login')} onVerTorneo={(torneo) => abrirDetalleTorneo(torneo, 'listado-torneos')} />
        : vista === 'panel-organizador'
        ? usuario?.rol === 'Organizador'
          ? <PanelPrincipal
              usuario={usuario}
              onCrearTorneo={() => setVista('crear-torneo')}
              onVerTorneo={(torneo) => abrirDetalleTorneo(torneo, 'panel-organizador')}
              onVerMisTorneos={abrirMisTorneos}
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
        : vista === 'perfil-publico'
        ? <MiPerfil idUsuario={perfilSeleccionadoId} publico onVolver={() => setVista('home')} />
        : vista === 'detalle-torneo'
        ? <TorneoDetalle
            idTorneo={torneoSeleccionado?.idTorneo}
            usuario={usuario}
            onSalir={() => setVista(volverDetalleA)}
          />
        : vista === 'info-extra-torneo'
        ? <InfoExtraTorneo />
        : vista === 'preguntas-frecuentes'
        ? <PreguntasFrecuentes />
        : vista === 'reglas-oficiales'
        ? <ReglamentoOficial />
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
        )
        : vista === 'pagina-no-encontrada'
        ? <PaginaNoEncontrada onVolverInicio={() => {
            window.history.replaceState({}, document.title, '/')
            setVista('home')
          }} />
        : (
            <Login
              onRegister={() => setVista('registro')}
              onLogin={manejarLogin}
            />
          )}

      {mostrarSitio && vista !== 'pagina-no-encontrada' && <Footer vistaActiva={vista} />}
    </div>
  )
}

export default App
