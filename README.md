# React + Vite

## Detalle de torneo

El cronograma muestra los horarios guardados y los iconos de las categorias, junto con el formato, limite, corte y avance de cada ronda. Comparte el formato de tiempos con las tarjetas de categorias. En pantallas pequenas, las tablas permiten desplazamiento horizontal.

Actualmente las actividades tienen hora de inicio y fin, pero no una fecha individual: se muestra el periodo del torneo y una sola tabla, sin asignar dias a las rondas.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Variables de entorno de la API

- Desarrollo local (`.env.development`): `http://localhost:3000/api`.
- Producción (`.env.production`): `https://solverankbackend.vercel.app/api`.
- En Vercel, `VITE_API_URL` puede definirse como variable de entorno para reemplazar la URL de producción.

En el proyecto de Vercel del backend, definir `CORS_ALLOWED_ORIGINS` con el origen público exacto del frontend (por ejemplo, `https://jirehsoftware.tech`). Para aceptar más de un origen, usar una lista separada por comas. Esta variable es independiente de `FRONTEND_URL`, que se reserva para el flujo de Google. En producción las cookies de sesión usan `SameSite=None; Secure` para permitir solicitudes con credenciales desde el frontend separado.