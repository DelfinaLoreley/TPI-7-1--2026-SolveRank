# SolveRank — Frontend

Aplicación web de SolveRank, una plataforma para consultar y gestionar torneos de speedcubing. Está construida con React y Vite y consume la API REST del backend SolveRank.

## Contenido

- [Funciones principales](#funciones-principales)
- [Tecnologías](#tecnologías)
- [Requisitos](#requisitos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Configuración de la API](#configuración-de-la-api)
- [Pantallas y navegación](#pantallas-y-navegación)
- [Comunicación con el backend](#comunicación-con-el-backend)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Compilación y publicación](#compilación-y-publicación)
- [Solución de problemas](#solución-de-problemas)

## Funciones principales

- Consulta y búsqueda de torneos, con información, categorías, fechas, sede, cupos e inscripciones.
- Registro e inicio de sesión con correo y contraseña, además de inicio con Google mediante el backend.
- Inscripción a torneos, gestión de favoritos y consulta de la actividad del usuario.
- Consulta de rankings, récords y perfiles de competidores.
- Herramientas para organizadores: panel de torneos, creación de eventos, carga de resultados y acceso a mezclas.
- Herramientas de administración: búsqueda de usuarios, consulta de roles y cambio de rol.
- Vistas adaptables a distintos tamaños de pantalla y componentes gráficos para estadísticas.

El acceso **SolveRank LIVE** del menú lleva a la sección de estadísticas del inicio (`#estadisticas`). La ficha del torneo también muestra su estado según las fechas del evento. La navegación de esta versión se resuelve dentro de la aplicación mediante estado de React, sin una librería de rutas.

## Tecnologías

- React 19 y React DOM.
- Vite 8 para desarrollo y compilación.
- Axios para las solicitudes HTTP.
- Chart.js y `react-chartjs-2` para gráficos del panel de organización.
- CSS para estilos y adaptación de las vistas.
- ESLint para análisis estático del código.

## Requisitos

- Node.js `20.19+` o `22.12+`.
- npm.
- El backend SolveRank en ejecución y conectado a su base de datos para las funciones que requieren información o sesión.

## Instalación y ejecución

Desde la carpeta raíz del frontend:

```bash
npm install
npm run dev
```

Vite muestra en la terminal la dirección local, normalmente `http://localhost:5173`. Para compilar para producción y previsualizar la compilación:

```bash
npm run build
npm run preview
```

Para revisar el estilo y posibles problemas estáticos:

```bash
npm run lint
```

## Configuración de la API

El cliente HTTP se configura en `src/axiosApi.js`. Su URL base es `VITE_API_URL` si está definida. Si no:

- En desarrollo usa `http://localhost:3000/api`.
- En producción usa `/api` relativo al mismo dominio.

Para apuntar a otra instancia, creá un archivo `.env.local` en la carpeta del frontend:

```dotenv
VITE_API_URL=http://localhost:3000/api
```

La variable debe incluir el prefijo `/api`. Reiniciá Vite después de modificarla. En producción, usá la URL pública del backend, por ejemplo:

```dotenv
VITE_API_URL=https://tu-backend.example.com/api
```

El repositorio incluye `vercel.json`, que reescribe `/api/*` hacia `https://solverankbackend.vercel.app/api/*`. Si se despliega el backend en otro dominio y no se configura `VITE_API_URL`, actualizá ese destino de reescritura.

## Pantallas y navegación

La vista inicial es **Inicio**. El componente `src/App.jsx` controla la vista activa y comparte el usuario y el torneo seleccionado con las pantallas correspondientes.

| Área | Vistas y acciones |
|---|---|
| Acceso | Inicio de sesión, registro y completar los datos de perfil después del acceso con Google. |
| Inicio y consulta | Inicio con próximos torneos y estadísticas, listado de torneos, detalle del torneo, búsqueda global, rankings y récords. |
| Cuenta | Perfil propio y perfiles públicos de competidores. |
| Participación | Inscripción y cancelación, favoritos, mis torneos y resultados publicados de un evento. |
| Organización | Panel principal, creación de torneo en pasos, mezclas por ronda y carga de resultados. |
| Administración | Gestión de usuarios y roles. |

La navegación principal está en `Navbar.jsx`; el detalle de torneo permite abrir secciones de información, cronograma, inscripción, mezclas y resultados según la sesión, el rol y los permisos del usuario. Al salir del detalle, se vuelve a la vista desde la que se abrió.

Los controles de acceso del frontend mejoran la navegación, pero los permisos efectivos los valida el backend. Los roles utilizados por el sistema son `Competidor`, `Juez`, `Delegado`, `Organizador` y `Administrador`.

## Comunicación con el backend

`src/axiosApi.js` crea una instancia compartida de Axios. `withCredentials: true` permite que el navegador envíe y reciba la cookie `HttpOnly` de sesión. Por eso las llamadas autenticadas deben usar esta instancia y no crear solicitudes sin credenciales.

Ejemplo de consulta de torneos y manejo de la respuesta:

```js
import axios from './axiosApi';

async function cargarTorneos() {
  const { data } = await axios.get('/torneos');
  return data.torneos;
}
```

Ejemplo de inicio de sesión: el backend establece la cookie en la respuesta y luego la aplicación recupera los datos de la persona autenticada:

```js
await axios.post('/auth/login', { email, password });
const { data } = await axios.get('/auth/miusuario');
setUsuario(data.usuario ?? null);
```

El inicio con Google redirige a `${axios.defaults.baseURL}/auth/google`. El backend gestiona el flujo OAuth y devuelve al frontend; si el perfil necesita completarse, la aplicación muestra el formulario correspondiente.

### APIs consumidas por las vistas

Las rutas se indican respecto de la URL base configurada en `VITE_API_URL` (que ya incluye `/api`). La API puede incorporar más rutas; esta lista resume las que usa el frontend actual.

| Uso en la aplicación | Métodos y rutas |
|---|---|
| Sesión y registro | `POST /auth/login`, `POST /auth/registro`, `POST /auth/logout`, `GET /auth/miusuario`, `GET /auth/google`, `PATCH /auth/completar-registro-google` |
| Búsqueda y catálogos | `GET /torneos/buscar`, `GET /usuarios/buscar`, `GET /paises`, `GET /generos`, `GET /torneos/categorias` |
| Inicio y torneos | `GET /torneos`, `GET /torneos/detalle/:idTorneo`, `GET /torneos/ranking/:idCategoria`, `GET /torneos/catalogos`, `POST /torneos` |
| Rankings y récords | `GET /torneos/rankings`, `GET /torneos/records` |
| Perfiles | `GET /usuarios/mi-perfil`, `GET /usuarios/perfil/:idUsuario`, `PUT /usuarios/mi-perfil` |
| Favoritos y actividad | `GET /torneos/favoritos`, `POST /torneos/favoritos/:idTorneo`, `DELETE /torneos/favoritos/:idTorneo`, `GET /torneos/mi-actividad` |
| Inscripción y resultados | `GET /torneos/:idTorneo/inscripcion/estado`, `POST /torneos/:idTorneo/inscripcion`, `DELETE /torneos/:idTorneo/inscripcion`, `GET /torneos/:idTorneo/resultados/acceso`, `GET /torneos/:idTorneo/resultados/rondas/:idRonda`, `POST /torneos/:idTorneo/resultados/rondas/:idRonda`, `GET /torneos/:idTorneo/resultados/publicos/completo` |
| Organización y mezclas | `GET /torneos/mis-torneos`, `GET /torneos/:idTorneo/mis-rondas`, `GET /mezclas/torneos/:idTorneo/acceso`, `GET /mezclas/torneos/:idTorneo/listado`, `POST /mezclas/torneos/:idTorneo/rondas/:idRonda/generar` |
| Administración | `GET /admin/roles`, `GET /admin/usuarios`, `PUT /admin/usuarios/:idUsuario/rol` |

### Ejemplo: inscribirse a un torneo

El componente de inscripción consulta primero el estado actual y envía las categorías seleccionadas. La cookie se adjunta automáticamente por la instancia compartida de Axios:

```js
const { data } = await axios.post(
  `/torneos/${idTorneo}/inscripcion`,
  { categorias: categoriasSeleccionadas }
);
```

El backend comprueba el rol, las fechas de inscripción, el cupo y que las categorías correspondan al torneo. Si la solicitud falla, el frontend muestra el mensaje de error enviado por la API cuando está disponible.

### Ejemplo: carga de resultados

La pantalla de carga obtiene los competidores y los intentos de una ronda. Al guardar, envía el identificador del competidor y la lista de intentos:

```js
await axios.post(
  `/torneos/${idTorneo}/resultados/rondas/${idRonda}`,
  { idUsuario, intentos }
);
```

Solo los roles habilitados por el backend y vinculados al torneo pueden guardar resultados. Los intentos deben respetar el formato configurado para la ronda.

## Estructura del proyecto

```text
src/
├── componentes/       # Navbar, búsqueda global y pie de página
├── hooks/             # Hooks compartidos, como el manejo de favoritos
├── utilidades/        # Funciones reutilizables para URLs e imágenes
├── vistas/
│   ├── admin/         # Gestión administrativa
│   ├── home/          # Página principal
│   ├── login/         # Inicio de sesión
│   ├── perfil/        # Perfiles
│   ├── rankings/      # Clasificaciones
│   ├── records/       # Récords
│   ├── registro/      # Registro y perfil de Google
│   ├── Organizador/   # Panel de organización
│   └── torneos/       # Listado, detalle, inscripción y gestión de torneos
├── axiosApi.js        # Cliente HTTP y URL base del backend
├── App.jsx            # Navegación y estado de la aplicación
└── main.jsx           # Punto de entrada de React
```

## Compilación y publicación

`npm run build` genera los archivos estáticos de producción en `dist/`. El proyecto incluye una regla de Vercel para reenviar las llamadas `/api` al backend configurado en `vercel.json`. Las variables `VITE_*` se incorporan durante la compilación: configurá `VITE_API_URL` en el entorno de build si no se utilizará la reescritura.

Las imágenes de torneos se cargan desde la URL que devuelve el backend. Para que se vean correctamente, el frontend debe apuntar a la misma instancia de backend que sirve esas imágenes.

## Solución de problemas

- **Error de conexión o solicitudes 404:** comprobá que el backend esté activo y que `VITE_API_URL` incluya `/api`.
- **No conserva la sesión:** usá la instancia de Axios de `src/axiosApi.js`, que tiene `withCredentials: true`, y verificá la configuración CORS y de cookies del backend.
- **Error CORS en desarrollo:** confirmá que frontend y backend usen los puertos/dominios esperados y que el backend permita credenciales.
- **Login con Google no vuelve al frontend:** revisá en el backend las credenciales OAuth y las URLs de callback y frontend.
- **Imágenes de torneos rotas:** verificá que la URL de API apunte al backend que expone las imágenes y que el recurso exista.
