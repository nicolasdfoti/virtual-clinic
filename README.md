# Clínica Virtual

Sistema de gestión de clínica virtual. React + FastAPI + PostgreSQL.

---

## Requisitos

| Herramienta | Versión |
|---|---|
| Node.js | 20 o superior |
| Python | 3.11 o superior |
| Docker Desktop | cualquiera (Windows 10/11, macOS, Linux) |

---

## Setup

### 1. Base de datos

Desde la **raíz** del repo, crear el `.env` que usa docker compose:

```bash
copy .env.example .env        # Windows PowerShell
# cp .env.example .env        # Linux / macOS
```

Levantar PostgreSQL y pgAdmin:

```bash
docker compose up -d
docker compose ps             # esperar a que postgres quede "healthy"
```

Postgres queda en `localhost:5432` y pgAdmin en `http://localhost:5050`.

### 2. Backend

Los comandos del backend se corren **desde `backend/`**. No desde la raíz: la
app lee su `.env` relativo al directorio actual.

**Windows (PowerShell):**

```powershell
cd backend

python -m venv venv
.\venv\Scripts\Activate.ps1

copy .env.example .env
```

Editar `backend/.env` y completar:

- `DATABASE_URL`, con los mismos usuario y contraseña que el `.env` de la raíz.
- `SECRET_KEY`, que **no** puede quedar como `change_me`. Generar una:

  ```powershell
  python -c "import secrets; print(secrets.token_urlsafe(48))"
  ```

Instalar dependencias y aplicar las migraciones:

```powershell
pip install --upgrade pip
pip install -r requirements-dev.txt

alembic upgrade head
```

Levantar la API:

```powershell
uvicorn app.main:app --reload
```

Queda en `http://localhost:8000`, con la documentación interactiva en
`http://localhost:8000/docs`.

**Linux / macOS:** igual, pero `source venv/bin/activate` y `cp` en vez de
`copy` / `.\venv\Scripts\Activate.ps1`.

### 3. Frontend

En otra terminal, desde `frontend/`:

```bash
cd frontend
copy .env.example .env       # Windows PowerShell

npm install
npm run dev
```

Queda en `http://localhost:5173`.

---

## Comandos

### Base de datos (raíz)

```bash
docker compose up -d        # levantar postgres + pgadmin
docker compose ps           # estado y healthcheck
docker compose logs -f postgres
docker compose down         # parar (conserva el volumen)
docker compose down -v      # parar y BORRAR el volumen postgres_data
```

### Migraciones (`backend/`)

```bash
alembic upgrade head                            # aplicar todo
alembic downgrade -1                            # revertir la última
alembic revision --autogenerate -m "mensaje"    # generar migración
```

Todo cambio de esquema va por una migración. Nunca `Base.metadata.create_all()`.

### Tests

```bash
# Backend, desde backend/
pytest

# Con Postgres real (recomendado): los tests borran las tablas entre casos,
# así que NUNCA apuntar TEST_DATABASE_URL a la base de desarrollo.
set TEST_DATABASE_URL=postgresql+psycopg://clinic_user:TU_PASS@localhost:5432/virtual_clinic_test
pytest

# Frontend, desde frontend/
npm test
npm run test:watch
```

Si no se define `TEST_DATABASE_URL`, la suite del backend corre en SQLite en
memoria. Sirve para iterar rápido, pero no cubre el dialecto de Postgres.

### Frontend (`frontend/`)

```bash
npm run dev      # dev server con HMR
npm run lint     # eslint
npm run test     # vitest
npm run build    # tsc -b && vite build (el typecheck va incluido)
```

### Dependencias del backend

`requirements.txt` es un lock compilado: **no editarlo a mano**. Editar
`requirements.in` (solo directas) y recompilar:

```bash
pip install pip-tools
pip-compile requirements.in
```

---

## Autenticación

JWT HS256 en una **cookie `httpOnly`** (`SameSite=Lax`), no en `localStorage`:
el token no queda accesible a JavaScript, así que un XSS no puede leerlo.

| Endpoint | Qué hace |
|---|---|
| `POST /api/auth/register` | Crea la cuenta. Siempre con rol `PATIENT`. |
| `POST /api/auth/login` | Verifica credenciales y setea la cookie. |
| `POST /api/auth/logout` | Borra la cookie. |
| `GET /api/auth/me` | Devuelve el usuario de la cookie. |

El frontend manda las peticiones con `credentials: 'include'` y CORS está
configurado con `allow_credentials=True`. Por eso `CORS_ORIGINS` tiene que
listar el origen exacto del front: con `*` el navegador bloquea la cookie.

Login nunca distingue entre "email inexistente" y "contraseña incorrecta"
(mismo 401 y mismo mensaje), y contra un email inexistente se verifica la
contraseña contra un hash ficticio para que el tiempo de respuesta no delate
qué emails están registrados.

**Alcance del logout:** el JWT es stateless, así que el logout borra la cookie
del navegador pero no invalida un token que ya haya sido copiado. El token
caduca solo por `ACCESS_TOKEN_EXPIRE_MINUTES` (30 por defecto). Para revocar
de verdad hace falta una lista de revocación en el servidor; queda pendiente.

---

## Estructura

```
frontend/src/
  components/     NavBar, secciones, ui/
  context/        AuthProvider, useAuth, authContext
  data/           mock de professionals, specialties, faqs (hasta Prompt 4)
  layouts/        MainLayout, AuthLayout
  pages/          rutas
  routes/         ProtectedRoute, mapa rol→ruta
  services/       api.ts (única capa HTTP) y auth.ts
backend/
  alembic/        migraciones
  app/
    core/         config.py (pydantic-settings) y security.py
    models/       user.py, doctor.py, enums.py
    routers/      auth.py
    schemas/      user.py
  database.py     engine y sesión
  dependencies.py get_current_user / get_current_active_user
  tests/          pytest
docs/             notas de decisiones técnicas
```

Las reglas de trabajo para agentes están en `AGENTS.md`.