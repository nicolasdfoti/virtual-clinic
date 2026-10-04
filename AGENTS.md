# AGENTS.md — Clínica Virtual

Reglas de trabajo para cualquier agente (humano o IA) que toque este repo.
Si una instrucción contradice el código existente, gana esta regla: **preguntá o documentá el supuesto** (ver [Proceso](#proceso)).

---

## 1. Stack

| Capa | Tecnología |
|---|---|
| Frontend (`frontend/`) | React 19.2 + TypeScript 6 + Vite 8 + Tailwind CSS 4 (`@tailwindcss/vite`) + react-router-dom 7 |
| Backend (`backend/`) | FastAPI 0.142 + SQLAlchemy 2.1 (declarativo, `Mapped[]`) + Alembic 1.20 + PostgreSQL 17 (psycopg 3) |
| Auth | JWT (HS256) en cookie `httpOnly` |
| Infra | Docker Compose (PostgreSQL + pgAdmin) en la raíz del repo |

Estructura:

```
frontend/src/{pages,components,context,routes,services,layouts,data,test}/
backend/app/{core,models,routers,schemas}/   # main.py, dependencies.py y database.py cuelgan de app/
backend/alembic/versions/                   # migraciones
backend/tests/                               # pytest (conftest, test_auth, test_config)
docs/                                        # ROADMAP.md, prompts/, notas de decisión
```

No existe `database/` ni `tests/` en la raíz: los tests del backend viven en
`backend/tests/` y los del frontend junto al código, en `src/**/__tests__/`.

---

## 2. Comandos

El compose está en la **raíz**. `alembic` y `uvicorn` deben correrse desde **`backend/`**: `load_dotenv()` busca `.env` relativo al CWD, y `DATABASE_URL` / `SECRET_KEY` viven en `backend/.env`.

### Base de datos (desde la raíz)

```bash
docker compose up -d        # levanta postgres + pgadmin
docker compose ps           # estado y healthcheck
docker compose logs -f postgres
docker compose down         # parar (conserva el volumen)
docker compose down -v      # parar y BORRAR el volumen postgres_data
```

`docker-compose.yml` usa `${POSTGRES_*}` **sin valores por defecto**: si falta el `.env` de la raíz, compose falla. No hardcodear esos valores.

### Migraciones (desde `backend/`)

```bash
alembic upgrade head                            # aplicar todo
alembic downgrade -1                            # revertir la última
alembic revision --autogenerate -m "mensaje"    # generar migración
```

`alembic/env.py` pisa `sqlalchemy.url` con `DATABASE_URL` de la app, así que el placeholder de `alembic.ini` no se usa.

### Backend (desde `backend/`)

```bash
uvicorn app.main:app --reload     # http://localhost:8000  (docs en /docs)
```

### Frontend (desde `frontend/`)

```bash
npm run dev                                     # dev server con HMR
npm run lint                                     # eslint
npx tsc --noEmit -p tsconfig.app.json            # typecheck puro (NO hay script "typecheck")
npm run build                                   # tsc -b && vite build (typecheck incluido)
```

### Tests

```bash
# Backend (desde backend/, con el venv activado)
pytest                                          # usa SQLite en memoria
set TEST_DATABASE_URL=postgresql+psycopg://clinic_user:PASS@localhost:5432/virtual_clinic_test
pytest                                          # contra Postgres: lo recomendado

# Frontend (desde frontend/)
npm test
npm run test:watch
```

`pytest` y `npm test` funcionan. La suite del backend corre en **SQLite en
memoria** salvo que se defina `TEST_DATABASE_URL`; el frontend usa **Vitest +
Testing Library + jsdom**.

Cuidado: la DB de tests se borra entera entre casos. `TEST_DATABASE_URL` nunca
debe apuntar a la base de desarrollo.

Vitest tiene que ir en la versión que soporta **vite 8** (`^5`): con vitest 3 se
instala un vite 7 anidado y `tsc -b` falla por tipos de `Plugin` incompatibles.

---

## 3. Convenciones

- **Idioma de la UI:** español rioplatense, con voseo. `"Completá todos los campos"`, `"Registrate"`, `"Accedé a tu cuenta"`. Nada de `"Complete"` / `"Register"` / `"Acceda"`.
- **La entidad es `Doctor`, nunca "Professional".** El modelo es `backend/app/models/doctor.py` (tabla `doctors`).
- **Rutas: URL en inglés, texto de UI en español rioplatense.** Son dos capas y no se mezclan.
  - **Públicas en inglés y plural:** `/doctors`, `/specialties`, `/about`, `/faq`, `/contact`. Listados y detalle plural, como en el resto del producto.
  - **Privadas en inglés y singular por área:** `/patient/*`, `/doctor/*`, `/admin/*`. Cada área privada cuelga de la raíz de su rol, no de un sustantivo plural.
  - **El texto de UI va en español rioplatense con voseo**, sin importar que la URL sea en inglés: `/patient/appointments` muestra "Tus turnos".
  - *Estado real (a corregir):* hoy la única privada implementada es **`/pacientes`** (solo `PATIENT`) en `frontend/src/App.tsx`, con `/patients` como redirect. **`/pacientes` viola la convención en las dos capas**: es privada pero plural, y es en español. Lo canónico es migrarla a `/patient/*` (por ejemplo `/patient/appointments`) y dejar `/pacientes` y `/patients` como redirects. `/doctor/*` y `/admin/*` no tienen página: las páginas que hoy usan el término "professional" hay que renombrarlas a `doctor` y colgarlas de `/doctors`.
- **Todo cambio de esquema pasa por una migración Alembic.** Nunca `Base.metadata.create_all()`, nunca edición manual de la tabla.
  - *Deuda:* la tabla `doctors` **sigue sin migración** (solo existe `2a8c31a987b6_create_users_table` y `7f3c1a9b4d21_role_enum_and_timestamptz`). Generarla.
- **Fechas en UTC con timezone (`timestamptz`).** La zona de la clínica es `America/Argentina/Buenos_Aires` y se aplica **solo al mostrar y al calcular horarios**, nunca al guardar ni comparar.
  - Corregido en `7f3c1a9b4d21`: `DateTime(timezone=True)` con `server_default=now()`.
  - **Estado de `7f3c1a9b4d21`: A VERIFICAR.** Una auditoría previa observó `alembic_version = 7f3c1a9b4d21` en el Postgres real, o sea aplicada; pero **no se pudo volver a confirmar** porque el stack de Docker estaba caído. Confirmar con `alembic current` (desde `backend/`) antes de asumir nada. Sigue pendiente revisar el supuesto de zona horaria de la migración (asume `America/Argentina/Buenos_Aires`).
- **Roles: `PATIENT`, `DOCTOR`, `ADMIN`. Estados y modalidades como `Enum`,** nunca strings sueltos que se puedan escribir mal.
  - `role` ya es `Enum` en mayúsculas (`app/models/enums.py`, migración `7f3c1a9b4d21`). No hay columnas `status` ni `modality` todavía.
- **Toda llamada HTTP del frontend pasa por `frontend/src/services/api.ts`.** Cero `fetch` suelto en componentes o páginas; los servicios de dominio (ej. `services/auth.ts`) van arriba de `api.ts` y reutilizan su manejo de errores.
- **No inventar datos de médicos, matrículas ni cifras en la UI.** Fuera de un modo demo explícito, no se muestran nombres de médicos, números de matrícula, precios, especialidad, años de experiencia, cantidad de pacientes ni ningún otro dato que no venga de un endpoint real. En marketing se habla del producto ("consultá con un profesional matriculado"), nunca de un profesional ficticio con credenciales. Los mocks de `frontend/src/data/` son contenido editorial de ejemplo, no fuente de datos de producto: se reemplazan por endpoints reales (ver `docs/ROADMAP.md`, prompts 3.x).
- **Ningún prompt supera ~400 líneas de diff de producción.** Si no entra, se parte en dos. Un prompt más grande no se "termina rápido": produce cambios que nadie revisa y deuda que nadie ve (pasó con el commit `3f6c42f`, 7.688 líneas).

---

## 4. Seguridad (no negociable)

- **El frontend nunca es la barrera de seguridad.** Ocultar un botón no protege nada: cada endpoint valida **autenticación, rol y ownership** del recurso por sí mismo.
- **Los helpers de autorización viven en un solo lugar:** `backend/app/core/` (y las dependencias en `backend/app/dependencies.py`). No duplicar checks de rol o de ownership dentro de los routers.
- **Ningún secreto en el repo.** `.env` no se commitea (ya está en `.gitignore`); `.env.example` sí, **sin valores reales** — placeholders tipo `change_me`. Nunca commitear `SECRET_KEY`, contraseñas de Postgres ni tokens.
- **Schemas de respuesta explícitos.** Nunca devolver el modelo SQLAlchemy crudo ni exponer `password_hash`. Cada endpoint declara su `response_model` en `backend/app/schemas/`.
- `SECRET_KEY` sin valor por defecto: si falta, la app falla al arrancar en vez de usar una clave frágil.
- Fijar `algorithms=["HS256"]` al decodificar JWT. Mensajes de login genéricos: nunca revelar si un email existe.

---

## 5. Proceso

1. **No cambiar comportamiento funcional sin necesidad.** Si el pedido es refactor, tests o docs, el output funcional tiene que ser idéntico.
2. **Cada feature trae tests.** Backend con `pytest`, frontend con `Vitest` + Testing Library. Sin test no hay feature terminada.
3. **Antes de terminar, correr y reportar de verdad:** lint, typecheck, tests y build. No escribir "funciona" si no lo ejecutaste. Si un comando no se pudo correr (falta tooling, falta Docker), decirlo explícitamente en vez de asumir.
4. **Ante ambigüedad, preguntar.** Si la instrucción contradice el código existente, preguntar o dejar el supuesto **documentado en el resumen final**.
5. **Resumen final obligatorio** de cada tarea:
   - Archivos **creados / modificados / eliminados** (con ruta).
   - **Decisiones** tomadas y por qué.
   - **Tests ejecutados** y su resultado real (conteo).
   - **Pendientes** y riesgos conocidos.
6. **OpenCode no hace `git commit`, `git push` ni cambia de rama** salvo que se lo pidas explícitamente en el mensaje. Preparar los cambios en el working tree sí es parte del trabajo; cerrar el flujo de Git es decisión tuya.
   - Tampoco ejecutar `git add --renormalize`, `git checkout`, `git restore`, `git reset` ni `git stash` sin pedido explícito: son operaciones que mueven o descartan trabajo.
   - **No commitear ni pushear salvo pedido explícito.** Si el pedido incluye commit, un commit por prompt y con mensaje al estilo del repo.

---

## Deuda conocida (reglas que el código todavía no cumple)

Resumen para no volver a tropezar con las mismas brechas:

| Regla | Estado real |
|---|---|
| Rutas `/doctor/*` y `/admin/*` | No tienen pagina. `ROLE_HOME` (`frontend/src/routes/roleHome.ts`) manda a `/doctors` y `/admin`, que no existen: un DOCTOR o ADMIN cae en la home de marketing sin aviso. Ver prompt 2.3. |
| Rutas privadas `/patient/*` | No existen. Hoy la única privada es `/pacientes`, que viola la convención en las dos capas (es privada pero plural, y es en español). Migrar a `/patient/*` dejando redirects. Ver prompt 5.1. |
| Helpers de autorización | La regla dice que viven en `backend/app/core/`, pero **ese archivo no existe**: hoy no hay `require_roles` ni verificación de ownership en ninguna parte. Solo hay autenticación (`get_current_user`). Ver prompt 2.3. |
| Migración para `doctors` | Falta: la tabla existe en los modelos pero no hay revision que la cree. |
| Logout real | El logout borra la cookie, pero el JWT es stateless: un token copiado sigue sirviendo hasta `ACCESS_TOKEN_EXPIRE_MINUTES`. No hay denylist. |
| Migraciones solo en Postgres | `7f3c1a9b4d21` usa `ALTER COLUMN`, `ENUM` nativo y `AT TIME ZONE`, asi que falla con un `RuntimeError` explicito en SQLite. Los tests no corren migraciones (arman el esquema desde los modelos), asi que no choca. |
| `Base.metadata.create_all` | Correcto en produccion: solo se usa en `tests/conftest.py` y en smokes locales. `app/models/__init__.py` importa los modelos para que la metadata no quede vacia. |
| Mock de `frontend/src/data/` | Sigue siendo mock, a proposito, hasta que haya endpoints reales. |
