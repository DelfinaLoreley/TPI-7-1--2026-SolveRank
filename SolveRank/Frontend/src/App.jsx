import './App.css'
import { useState } from 'react'
import Login from './vistas/login/Login.jsx'
import Registro from './vistas/registro/Registro.jsx'

function App() {
  const [vista, setVista] = useState('login')

  return (
    <div>
      {vista === 'registro'
        ? <Registro />
        : <Login onRegister={() => setVista('registro')} />}
    </div>
  )
}

export default App
