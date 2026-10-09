# Clínica Virtual — Frontend

Aplicación web de telemedicina. Es la parte pública del proyecto: presentación de
la plataforma, contacto y autenticación. El portal de pacientes, médicos y
administradores llega en una fase posterior (rutas `/app`).

Stack: React 19 + React Router 7 + TypeScript + Vite + Tailwind CSS 4, con
Vitest + Testing Library para tests.

## Requisitos

- Node.js 20 o superior (probado con Node 22).
- La API del backend corriendo (ver `../backend`) o, al menos, un
  `VITE_API_URL` apuntando a algún backend.

## Puesta en marcha

```bash
npm install
cp .env.example .env   # en Windows: copy .env.example .env
npm run dev
```

La app queda en `http://localhost:5173`.

## Variables de entorno

Se cargan desde `frontend/.env` (no se versiona; hay un `.env.example` de
referencia). Vite solo expone al bundle las variables con prefijo `VITE_`, y
**quedan visibles en el navegador**: nunca pongas secretos acá.

| Variable       | Descripción                                                      | Default                     |
| -------------- | ---------------------------------------------------------------- | --------------------------- |
| `VITE_API_URL` | Base de la API, incluido el prefijo `/api` que usa el backend.    | `http://localhost:8000/api` |

## Scripts

| Comando             | Qué hace                                  |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Servidor de desarrollo con HMR.           |
| `npm run build`     | Chequeo de tipos (`tsc -b`) + build.      |
| `npm run preview`   | Sirve el build de producción localmente.  |
| `npm run lint`      | ESLint sobre todo el proyecto.            |
| `npm test`          | Corre los tests una vez (Vitest).         |
| `npm run test:watch`| Tests en modo watch.                      |

## Estructura

- `src/components` — componentes de UI, navbar, footer y secciones de la home.
- `src/pages` — páginas asociadas a rutas (`Home`, `About`, `Professionals`, `FAQ`, `Contact`, `Login`, `Register`, `Legal`).
- `src/config/clinic.ts` — datos públicos de la clínica (con `TODO` para completar).
- `src/data` — contenido de las secciones (preguntas frecuentes, cómo funciona, especialidades).
- `src/services` — cliente de la API y sesión.
- `src/routes` — `ProtectedRoute` y helper del home por rol.
