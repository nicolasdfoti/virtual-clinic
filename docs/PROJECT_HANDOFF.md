# PROJECT HANDOFF — Clínica Virtual

Informe técnico de auditoría generado el **2026-10-03**.
Todo lo que sigue se verificó contra el código, la base real y los comandos ejecutados en esta sesión.
**No se modificó código funcional.** La única escritura fuera de este archivo fue una fila de prueba
creada y eliminada durante el smoke test (ver [§12](#12-riesgos)).

---

## 1. Estado de Git

### Comandos ejecutados

```bash
git rev-parse --abbrev-ref HEAD
git log -1 --format='%H %ad %an %s' --date=iso
git log -10 --format='%h %ad %s' --date=short
git branch -vv
git branch -r -v
git remote -v
git status --porcelain
git log --oneline --all --graph --decorate
git diff --stat
git diff --stat --ignore-cr-at-eol
```

### Resultados

| Dato | Valor |
|---|---|
| Rama actual | `main` |
| Último commit | `ece29aa` — *feat: stabilize application foundation* |
| Autor / fecha | NicolasFoti — 2026-10-03 12:28:25 -0300 |
| Remoto | `origin` → `https://github.com/nicolasdfoti/virtual-clinic.git` |
| `origin/main` | `ece29aa` (igual que `main`, **todo pusheado**) |
| `feat/01-estabilizar` | `ece29aa` (mismo commit, ya fusionado) |
| Ramas totales | 2 (`main`, `feat/01-estabilizar`) |
| Working tree | 52 archivos "modificados", **0 cambios de contenido** |

### Últimos commits

```
ece29aa 2026-10-03 feat: stabilize application foundation
0ec86c6 2026-10-02 updated register functionality
8a18cb7 2026-10-01 started backend
3f6c42f 2026-09-29 Updated frontend
e8dac32 2026-09-29 Updated repo
```

El grafo es **lineal, sin ramas**:

```
* ece29aa (HEAD -> main, origin/main, origin/HEAD, feat/01-estabilizar)
* 0ec86c6
* 8a18cb7
```

### ⚠️ Falso "working tree sucio": 52 archivos son puro CRLF

`git status` muestra 52 archivos modificados, pero:

```
git diff --stat                 → 52 files changed, 9122 insertions(+), 9122 deletions(-)
git diff --stat --ignore-cr-at-eol → (vacío)
```

**Cero cambios semánticos.** El commit `ece29aa` guarda todo con **LF** y el disco tiene **CRLF**:

| Archivo | En HEAD | En disco |
|---|---|---|
| `backend/app/routers/auth.py` | CRLF=0 LF=158 | CRLF=158 LF=0 |
| `frontend/src/services/api.ts` | CRLF=0 LF=138 | CRLF=138 LF=0 |
| `README.md` | CRLF=0 LF=212 | CRLF=212 LF=0 |
| `AGENTS.md` | CRLF=0 LF=146 | CRLF=146 LF=0 |

**Causa raíz: no existe `.gitattributes`.** Confirmado con `git ls-files .gitattributes` → vacío.
Git no tiene política de normalización, así que cualquier guardado desde Windows/OneDrive ensucia
`git status` para siempre.

**Riesgo de perder trabajo: bajo.** Todo el contenido está commiteado y pusheado. El ruido no se puede
commitear por accidente sin arrastrar 9122 líneas de basura, pero **empezar una feature con este `git status`
sucio invita a hacer `git checkout .` / `git restore .` y tirar cambios reales**.

**Recomendación (primer paso de la próxima sesión):** agregar `.gitattributes` con `* text=auto eol=lf`
y renormalizar **una sola vez**, en un commit propio y aislado.

### Estado de archivos sensibles

| Archivo | ¿Trackeado? | ¿Ignorado? |
|---|---|---|
| `.env` | no | sí |
| `backend/.env` | no | sí |
| `frontend/.env` | no | sí |
| `.env.example` | sí | — |
| `backend/.env.example` | sí | — |
| `frontend/.env.example` | sí | — |

Los tres `.env` reales existen en disco, están correctamente ignorados y contienen valores reales.
Las claves presentes (sin revelar valores) son:

- `.env` → `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`, `PGADMIN_EMAIL`, `PGADMIN_PASSWORD`, `PGADMIN_PORT`
- `backend/.env` → `DATABASE_URL`, `SECRET_KEY` (43 chars, no placeholder)
- `frontend/.env` → `VITE_API_URL`

---

## 2. Arquitectura del Proyecto

### Estructura real verificada

```
virtual-clinic/
├── .env / .env.example        credenciales de Docker (Postgres + pgAdmin)
├── .gitignore                 sin .gitattributes
├── AGENTS.md                  reglas de trabajo (146 líneas)
├── README.md                  guía de setup Windows/venv
├── docker-compose.yml         Postgres 17 + pgAdmin (solo dev)
│
├── backend/
│   ├── .env / .env.example
│   ├── alembic.ini
│   ├── requirements.in        directas (editables)
│   ├── requirements.txt       lock compilado (pip-compile)
│   ├── requirements-dev.txt   pytest, httpx, pip-tools
│   ├── pytest.ini
│   ├── alembic/
│   │   ├── env.py             target_metadata = Base.metadata
│   │   └── versions/          2 revisiones
│   ├── app/
│   │   ├── main.py            FastAPI, CORS, /api/health
│   │   ├── database.py        engine, SessionLocal, Base, get_db
│   │   ├── dependencies.py    get_current_user / get_current_active_user
│   │   ├── core/              config.py (pydantic-settings), security.py
│   │   ├── models/            user.py, doctor.py, enums.py, __init__.py
│   │   ├── routers/           auth.py  ← único router
│   │   └── schemas/           user.py
│   └── tests/                 conftest, test_auth, test_config
│
├── frontend/
│   ├── .env / .env.example
│   ├── package.json           React 19.2, Vite 8, TS 6, vitest 5
│   ├── vite.config.ts         plugins + bloque `test`
│   ├── eslint.config.js
│   ├── tsconfig{,.app,.node}.json
│   └── src/
│       ├── main.tsx / App.tsx / index.css / App.css
│       ├── layouts/           MainLayout.tsx (exporta MainLayout + AuthLayout)
│       ├── pages/             Home, About, FAQ, Specialties, Professionals,
│       │                      Patients, Contact, Login, Register
│       ├── components/        NavBar, Hero, Footer, SpecialtyCard
│       │   ├── sections/      12 secciones + index.ts
│       │   └── ui/            Button, CTA, Card, buttonStyles
│       ├── context/           authContext.ts, useAuth.ts, AuthProvider.tsx
│       ├── routes/            ProtectedRoute.tsx, roleHome.ts, __tests__/
│       ├── services/          api.ts (única capa HTTP), auth.ts
│       ├── data/              6 archivos de MOCK (contact, faqs, howItWorks,
│       │                      professionals, specialties, values)
│       ├── test/              setup.ts, testUtils.ts
│       └── pages/__tests__/   Login.test.tsx
│
└── docs/
    └── auth-libs-migration.md
```

### Responsabilidad de cada parte

| Parte | Responsabilidad | Estado |
|---|---|---|
| `backend/app/main.py` | Instancia FastAPI, aplica CORS, monta routers bajo `/api`, expone `/api/health` | Funcional |
| `backend/app/core/config.py` | **Única** fuente de configuración. Lee `.env` con pydantic-settings | Funcional |
| `backend/app/core/security.py` | Hash (passlib/bcrypt), firma y verificación JWT (python-jose) | Funcional, libs en deuda |
| `backend/app/database.py` | Engine, `SessionLocal`, `Base`, dependency `get_db` | Funcional |
| `backend/app/dependencies.py` | Extrae el usuario del cookie JWT. **401 vs 403** | Funcional |
| `backend/app/routers/auth.py` | Los 3 endpoints de auth + cookies | Funcional |
| `backend/app/schemas/user.py` | Validación y **normalización** de entrada | Funcional |
| `backend/alembic/` | Versiones del esquema | 2 de N revisiones |
| `frontend/src/services/api.ts` | **Único** punto de salida HTTP. `credentials: 'include'`, `ApiError` | Funcional |
| `frontend/src/context/` | Estado global de sesión (`AuthProvider` + `useAuth` + contexto) | Funcional |
| `frontend/src/routes/` | `ProtectedRoute` (sesión + rol) y mapa rol→ruta | Funcional, 1 sola ruta protegida |
| `frontend/src/data/` | **MOCK** de contenido editorial | LEGACY a propósito |
| `docker-compose.yml` | Solo infra de datos. Backend y frontend corren en el host | Funcional |

### Carpetas que `AGENTS.md` menciona pero NO existen

- `database/` en la raíz — no existe.
- `tests/` en la raíz — no existe (los tests viven en `backend/tests/` y `frontend/src/**/__tests__/`).
- `AuthLayout` como archivo propio — no existe; se exporta desde `layouts/MainLayout.tsx`.

---

## 3. Backend

### FastAPI — `app/main.py`

| Aspecto | Detalle |
|---|---|
| Versión | `fastapi==0.142.2` |
| CORS | `allow_origins=settings.CORS_ORIGINS`, `allow_credentials=True`, `allow_methods/headers=["*"]` |
| Health | `GET /api/health` → `{status, message, service}` |
| Routers | **Solo** `auth.router` con `prefix="/api"` |

CORS está bien configurado para cookies: `allow_credentials=True` exige que los orígenes sean
explícitos (nunca `*`), y eso es lo que hace la lista de `CORS_ORIGINS`.

**Deuda:** `allow_methods=["*"]` y `allow_headers=["*"]` son excesivos para una API que solo usa
`GET`/`POST`. No es un agujero (CORS no es control de acceso), pero se puede endurecer.

### Endpoints reales (extraídos del OpenAPI)

```
POST   /api/auth/login        Login
POST   /api/auth/logout       Logout
GET    /api/auth/me           Me
POST   /api/auth/register     Register
GET    /api/health            Health Check
```

Schemas publicados: `HTTPValidationError`, `LoginRequest`, `Role`, `UserCreate`, `UserResponse`, `ValidationError`.

**No existe un solo endpoint de dominio.** No hay profesionales, turnos, turnos médicos, ni nada de eso.

### Configuración — `app/core/config.py`

`Settings(BaseSettings)` con `env_file=".env"`:

| Variable | Tipo | Default | Notas |
|---|---|---|---|
| `DATABASE_URL` | `str` | **requerida** | Sin default: la app no arranca sin ella |
| `SECRET_KEY` | `str` | **requerida** | `min_length=32`, rechaza `change_me` |
| `ENVIRONMENT` | `str` | `development` | `development\|testing\|production` |
| `COOKIE_SECURE` | `bool` | `false` | Forzado a `True` si `ENVIRONMENT=production` |
| `CORS_ORIGINS` | `list[str]` | `["http://localhost:5173"]` | CSV en el `.env` |
| `SQL_ECHO` | `bool` | `false` | |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `int` | `30`, `gt=0` | |

PuntosVerified:
- `CORS_ORIGINS: Annotated[list[str], NoDecode]` — **crítico**. Sin `NoDecode`, pydantic-settings
  intenta parsear el valor del entorno como JSON *antes* de correr los validadores, y un CSV plano
  lanza `SettingsError`. Esto fue un bug real que impedía arrancar la app.
- `reject_placeholder_secret` impide arrancar con el `SECRET_KEY` de ejemplo.
- `cookie_secure` es una **property**: `production` fuerza HTTPS.
- `get_settings()` con `@lru_cache`.

**Deuda:** `ENVIRONMENT` es un `str` libre, no un `Enum` ni un `Literal`. `ENVIRONMENT=produccion`
(tipografía) haría que `cookie_secure` devuelva `False` en producción sin avisar.

### Base de datos — `app/database.py`

```python
engine = create_engine(DATABASE_URL, echo=settings.SQL_ECHO)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
class Base(DeclarativeBase): pass
def get_db(): ...      # yield session, finally close
```

**Deuda:**
- Sin `pool_pre_ping=True`: una conexión que el server de Postgres cerró por timeout se entrega
  rota al primer request. Con `restart: unless-stopped` y PgBouncer/ firewalls esto aparece en
  producción, no en local.
- Sin `pool_size`/`max_overflow` explícitos (defaults: 5 + 10 overflow).
- Sin `connect_args` de timeout.
- `get_db()` no hace rollback ante excepción: el `finally` cierra la sesión y SQLAlchemy hace
  rollback implícito al liberar el connection, así que funciona, pero no es explícito.

### Dependencies — `app/dependencies.py`

| Función | Comportamiento |
|---|---|
| `get_current_user` | Lee cookie `access_token`; sin cookie / token inválido / usuario inexistente → **401** `"Sesión inválida o expirada."` |
| `get_current_active_user` | Envuelve al anterior; si `is_active` es False → **403** `"Tu cuenta está desactivada."` |

La separación 401 vs 403 es deliberada y está documentada en el docstring: 401 = "re-loguearse",
403 = "mostrarle el motivo".

**Deuda:** `CREDENTIALS_HEADERS = {"WWW-Authenticate": "Bearer"}` se sigue mandando aunque la
autenticación es por cookie. Es un header engañoso (dice Bearer cuando no hay header `Authorization`).
Además **no hay helper de rol**: `dependencies.py` no tiene `require_roles(...)`. Hoy el único control
de rol real es `role=Role.PATIENT` hardcodeado en el registro, y `allowedRoles` en el frontend.

### Seguridad — `app/core/security.py`

| Función | Detalle |
|---|---|
| `hash_password` | `CryptContext(schemes=["bcrypt"], deprecated="auto")` |
| `verify_password` | `pwd_context.verify` |
| `create_access_token` | JWT HS256, payload `{"sub", "exp"}`, `exp` en UTC |
| `decode_access_token` | `jwt.decode(..., algorithms=["HS256"])`, valida que `sub` sea dígitos |

Correcto: `algorithms=["HS256"]` está fijado (previene el ataque de algoritmo), `exp` se genera con
`datetime.now(timezone.utc)`, y un `sub` no numérico se rechaza.

**Deuda — la más relevante del backend:** sigue usando **`python-jose` 3.5.0** y **`passlib` 1.7.4**.
`passlib` está sin mantenimiento desde 2020 y su última release (1.7.4) rompe con `bcrypt>=4.1`,
por eso el proyecto pinea `bcrypt==4.0.1`. `python-jose` tuvo CVE-2024-33663 y 33664. El análisis y el
plan de migración a **PyJWT + pwdlib** ya están escritos en `docs/auth-libs-migration.md`. El usuario
decidió **diferir** el swap; sigue siendo la deuda de seguridad más grande del proyecto.

### Hashing

`bcrypt` con `passlib`. `schemas/user.py` rechaza passwords de **más de 72 bytes** en vez de truncar,
porque bcrypt corta silenciosamente y dos claves distintas pueden dar el mismo hash. Verificado en los
tests (`test_register_con_password_de_73_bytes_falla`).

### Cookies / tokens — `app/routers/auth.py`

```python
response.set_cookie(
    key="access_token", value=token,
    max_age=30*60, httponly=True,
    secure=settings.cookie_secure, samesite="lax", path="/",
)
```

Flags verificados en el smoke real contra Postgres:

```
set-cookie: access_token=eyJ...; HttpOnly; Max-Age=1800; Path=/; SameSite=lax
```

- `HttpOnly` ✓ (JS no puede leerlo)
- `SameSite=lax` ✓ (defensa CSRF básica)
- `Secure` ausente en dev porque `ENVIRONMENT=development` ✓ correcto; se fuerza en producción
- **Logout** → `delete_cookie` con `Max-Age=0` ✓

### Manejo de errores

No hay handlers globales ni `exception_handler` custom. Todo se resuelve con `HTTPException`.
Consecuencia: los 422 de validación de Pydantic devuelven el `detail` como **array** de objetos
`{loc, msg, type}`, no como string. El frontend lo contempla: `api.ts` tiene `readDetail()` que aplana
ese array a `"campo: mensaje · campo2: mensaje"` (verificado leyendo `src/services/api.ts`).

**Deuda:** una `IntegrityError` de SQLAlchemy (ver [§12](#12-riesgos)) sube como **500** crudo.

---

## 4. Modelo de Datos

### Estado de las tres fuentes

| Tabla | En modelos | En migraciones | En PostgreSQL real |
|---|---|---|---|
| `users` | ✅ | ✅ | ✅ |
| `doctors` | ✅ | ❌ **falta** | ❌ **falta** |
| `alembic_version` | — | — | ✅ |

> Verificado por conexión directa: `select table_name from information_schema.tables where table_schema='public'`
> → `alembic_version`, `users`. **Nada más.**

### `users` — columnas reales (leídas de `information_schema`)

| # | Columna | Tipo real | Len | Null | Default |
|---|---|---|---|---|---|
| 1 | `id` | `int4` | — | NO | `nextval('users_id_seq'::regclass)` |
| 2 | `email` | `varchar` | 255 | NO | — |
| 3 | `password_hash` | `varchar` | 255 | NO | — |
| 4 | `first_name` | `varchar` | 100 | NO | — |
| 5 | `last_name` | `varchar` | 100 | NO | — |
| 6 | `role` | **`user_role`** | — | NO | `'PATIENT'::user_role` |
| 7 | `is_active` | `bool` | — | NO | `true` |
| 8 | `created_at` | **`timestamptz`** | — | NO | `now()` |
| 9 | `updated_at` | **`timestamptz`** | — | NO | `now()` |

### Índices reales (`pg_indexes`)

```sql
CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email)
CREATE INDEX        ix_users_id    ON public.users USING btree (id)
CREATE UNIQUE INDEX users_pkey     ON public.users USING btree (id)
```

`UNIQUE` está implementado como **índice único**, no como constraint. Cumple su función pero
`information_schema.table_constraints` no lo lista como `UNIQUE`.

### Constraints reales

```
[PRIMARY KEY] users_pkey: PRIMARY KEY (id)
```

**No hay CHECK constraints. No hay foreign keys en `users`.**

### Relaciones

`doctors.user_id → users.id` (FK, `unique=True`, `NOT NULL`) existe **solo en código**.

### Enums

Tipo nativo de Postgres `user_role` con valores `PATIENT,DOCTOR,ADMIN` — **confirmado en la base real**.
Definido en `app/models/enums.py` como `class Role(str, enum.Enum)`.

### Timestamps

`timestamptz` con `server_default=now()` — correcto, y la migración ya aplicada lo hizo bien.
`updated_at` **no tiene trigger de base**: el `onupdate=func.now()` es solo del lado SQLAlchemy, así que
un `UPDATE` hecho por SQL crudo, pgAdmin o un `psql` no refresca `updated_at`.

### Comparación Models vs Migraciones vs Base real

```
Modelos SQLAlchemy   → users ✓, doctors ✓
Migraciones Alembic  → users ✓, doctors ✗
Base PostgreSQL real → users ✓, doctors ✗
```

**Modelos y base real están alineados en `users`.** La única diferencia es `doctors`, que está en
código pero en ningún otro lado. Esto **no** es un problema de datos: es una tabla que nunca se usó.

### Drift detectado por `alembic check`

```
INFO  Detected added table 'doctors'
INFO  Detected added index 'ix_doctors_id' on ('id',)
ERROR New upgrade operations detected: [('add_table', Table('doctors', ...)),
      ('add_index', Index('ix_doctors_id', ...))]
FAILED: New upgrade operations detected
```

Exit code **255**. **El único drift del proyecto es `doctors`.** No hay ninguna otra diferencia entre
modelos y base real —validado contra el Postgres de verdad.

### Contenido de la base

`select count(*) from users` → **2 filas**. La secuencia `users_id_seq` está en 7+ (hubo filas borradas).

---

## 5. Autenticación y RBAC

### Registro — `POST /api/auth/register`

1. `UserCreate` valida con Pydantic: `EmailStr`, password 8..72 bytes, nombres 1..100 con `strip()`.
2. `email` se normaliza a minúsculas (`normalize_email`), en el schema y otra vez en el router.
3. Si el email existe → **400** `"No se pudo completar el registro."` (genérico, no revela nada).
4. Se crea el usuario con **`role=Role.PATIENT` hardcodeado**.
5. `extra="ignore"` en `UserCreate`: aunque el cliente mande `"role":"ADMIN"`, Pydantic lo descarta.

✅ **Anti-escalada de privilegios verificada** por `test_register_ignora_el_role_enviado_por_el_cliente`.

### Login — `POST /api/auth/login`

```
email = normalize_email(...)
user  = db.query(User).filter(User.email == email).first()
password_hash = user.password_hash if user else DUMMY_PASSWORD_HASH   ← anti-timing
password_matches = verify_password(...)
if user is None or not password_matches:  → 401 "Credenciales inválidas."
if not user.is_active:                    → 403 "Credenciales inválidas."   ← mismo mensaje
set_auth_cookie(response, create_access_token(subject=str(user.id)))
```

Dos decisiones de seguridad acertadas:

- **Anti-enumeración:** email inexistente y password incorrecta devuelven el **mismo status y el mismo
  mensaje**. Verificado en vivo:
  ```
  password incorrecta → 401 {"detail":"Credenciales inválidas."}
  email inexistente   → 401 {"detail":"Credenciales inválidas."}
  ```
- **Anti-timing:** `DUMMY_PASSWORD_HASH` (bcrypt de una contraseña ficticia) se verifica siempre, para
  que un email inexistente tarde lo mismo que uno real.

La cuenta inactivada devuelve **403 con el mensaje genérico**: decir "tu cuenta está desactivada"
confirmaría que el email existe *y* que la contraseña es correcta.

### Logout — `POST /api/auth/logout`

```python
clear_auth_cookie(response)   # delete_cookie → Max-Age=0
return None                   # 204
```

✅ Verificado: `204` + `set-cookie: access_token=""; ... Max-Age=0`.

❌ **No invalida el token.** El JWT es stateless y no hay denylist. Verificado en vivo contra Postgres:

```
token copiado a mano, DESPUÉS del logout → 200 (sigue sirviendo)
```

Es la limitación de seguridad más conocida y ya está documentada en `AGENTS.md` y en el README.

### `/me` — `GET /api/auth/me`

Usa `get_current_active_user`. Estados observados:

| Escenario | Resultado |
|---|---|
| Sin cookie | 401 `"Sesión inválida o expirada."` |
| Cookie inválida | 401 (idéntico) |
| Cookie válida | 200 con el usuario |
| Usuario inactivo | 403 `"Tu cuenta está desactivada."` |

### Roles

Definidos y persistidos: `PATIENT`, `DOCTOR`, `ADMIN`.

| Rol | ¿Existe en enum? | ¿Tiene área en el frontend? | ¿Puede alcanzar la API? |
|---|---|---|---|
| `PATIENT` | ✅ | ✅ `/pacientes` | ✅ único flujo real |
| `DOCTOR` | ✅ | ❌ | ⚠️ existe el enum, no hay endpoint |
| `ADMIN` | ✅ | ❌ | ⚠️ existe el enum, no hay endpoint |

**No hay forma de crear un DOCTOR o ADMIN:** `register` siempre fuerza `PATIENT`, no hay endpoint de
promoción, no hay seed, no hay panel. Para probar RBAC hace falta tocar la base a mano.

### ProtectedRoute — `frontend/src/routes/ProtectedRoute.tsx`

```tsx
if (status === 'loading')            → pantalla "Cargando…"  (role="status")
if (status === 'anonymous' || !user) → <Navigate to="/login" state={{from: pathname}}/>
if (allowedRoles && !includes(role)) → si home === pathname: mensaje "No tenés acceso"
                                       si no:              <Navigate to={home} replace/>
return <Outlet/>
```

Dos decisiones importantes:

- **No redirige mientras revalida.** `AuthProvider` hace `GET /auth/me` al montar; durante ese
  `status === 'loading'` se muestra un loader en vez de mandar al login. Sin eso, recargar una página
  privada te botaría al login aunque tuvieras sesión válida.
- **`state.from`** recuerda la ruta pedida para poder volver después del login.

El corte `home === location.pathname` existe porque `homeForRole('DOCTOR')` devuelve `/doctors`: si un
DOCTOR entrara a una ruta restringida a `PATIENT` que se llamara igual que su home, se produciría un
loop infinito de navegación. Cubierto por `test_no_hace_loop_cuando_el_home_del_rol_es_la_misma_ruta_restringida`.

### Mapa rol→ruta — `frontend/src/routes/roleHome.ts`

```ts
ROLE_HOME = { PATIENT: '/pacientes', DOCTOR: '/doctors', ADMIN: '/admin' }
```

⚠️ **`/doctors` y `/admin` NO existen como ruta.** `App.tsx` solo declara `/pacientes`. Si un DOCTOR o
un ADMIN successfully tuvieran sesión, `Navigate` los mandaría a una ruta inexistente y el catch-all
`*` los rebotaría a `/`, y de ahí `ProtectedRoute` los mandaría otra vez a su home → **loop
home ⇄ `/`** en producción. Hoy es inalcanzable porque no se pueden crear esos roles, pero es una
bomba de tiempo en cuanto se agreguen las páginas.

### Ownership checks

**No existen.** No hay `require_roles`, ni helpers de ownership, ni un solo endpoint de recurso con
`user_id` que comparar. `AGENTS.md` §4 lo exige ("el frontend nunca es la barrera de seguridad") y hoy
no hay nada que proteger porque no hay recursos. Cuando se agreguen turnos o mensajes, esto hay que
construirlo desde el principio.

---

## 6. Frontend

### Stack

| Capa | Versión declarada |
|---|---|
| React | `^19.2.8` |
| TypeScript | `~6.0.2` |
| Vite | `^8.3.0` (instalado 8.3.1) |
| Tailwind | `^4.3.3` vía `@tailwindcss/vite` |
| react-router-dom | `^7.18.4` |
| Vitest | `^5.0.3` |

⚠️ **Vitest está en 5 y no en 3 a propósito.** Vitest 3 declara `vite: ^5||^6||^7`; con Vite 8 se
instalaba un **vite 7 anidado** en `node_modules/vitest/node_modules/vite` y `tsc -b` fallaba con
`TS2769: Type 'Plugin<any>[]' is not assignable to type 'PluginOption'` por las definiciones de
`hotUpdate` incompatibles entre vite 7 (rollup) y vite 8 (rolldown). Con vitest 5 la copia anidada
desaparece.

`vite.config.ts` importa `defineConfig` de **`vitest/config`**, no de `vite`, porque es el único que
acepta la clave `test` en el tipado.

### Rutas reales (`App.tsx`)

| Ruta | Página | Acceso |
|---|---|---|
| `/` | Home | público |
| `/about` | About | público |
| `/faq` | FAQ | público |
| `/specialties` | Specialties | público |
| `/specialties/:specialtyId` | Specialties | público |
| `/professionals` | Professionals | público |
| `/professionals/:id` | Professionals | público |
| `/contact` | Contact | público |
| `/services` | → redirect `/specialties` | público |
| `/patients` | → redirect `/pacientes` | compat |
| **`/pacientes`** | **Patients** | **🔒 `allowedRoles={['PATIENT']}`** |
| `/login` | Login | `AuthLayout` |
| `/register` | Register | `AuthLayout` |
| `*` | → redirect `/` | — |

**Solo hay una ruta protegida.** `/pacientes` es un redirect de `/patients`, que era la ruta anterior.

⚠️ **`/pacientes` es contenido de marketing, no un panel de paciente.** `Patients.tsx` importa
`patientFeatures` de `../data/howItWorks` y renderiza hero + cards + CTA. No hay datos del usuario, ni
turnos, ni historial. Lo único "privado" es la restricción de rol.

### Rutas que todavía no existen

| Ruta | Quién la necesita | Consecuencia |
|---|---|---|
| `/doctors` | `DOCTOR` | loop con el catch-all (ver §5) |
| `/admin` | `ADMIN` | ídem |
| `/turnos`, `/doctors/:id/turnos` | todos | — |
| `/mensajes` | todos | — |
| `/historial-clinico` | `DOCTOR` | — |
| `/registro` (reset de contraseña) | todos | — |

### Nomenclatura legacy: "professional"

15 archivos siguen usando "professional" donde la entidad se llama `Doctor`:

```
src/App.tsx                              src/pages/Professionals.tsx
src/components/NavBar.tsx                src/pages/About.tsx
src/components/Hero.tsx                  src/pages/Home.tsx
src/components/Footer.tsx                src/pages/Patients.tsx
src/components/sections/CTASection.tsx   src/pages/Specialties.tsx
src/components/sections/index.ts
src/components/sections/ProfessionalsSection.tsx
src/data/professionals.ts  src/data/specialties.ts  src/data/howItWorks.ts
```

Contrasta con `AGENTS.md` §3: *"La entidad es `Doctor`, nunca 'Professional'."* El modelo de datos ya
se llama `doctor.py` / tabla `doctors`; el frontend quedó atrás. Ojo: `AGENTS.md` §3 también dice que
`/doctors` es el nombre canónico "pero la única privada implementada hoy es `/pacientes`" — son dos
reglas en tensión dentro del mismo documento.

### Contexto de autenticación

Tres archivos, separación deliberada para satisfacer ESLint:

| Archivo | Exporta | Rol |
|---|---|---|
| `context/authContext.ts` | `AuthContext`, tipos `AuthStatus`, `AuthContextValue` | Sin JSX ni hook |
| `context/AuthProvider.tsx` | `AuthProvider` | `useState`/`useEffect`/`useCallback`/`useMemo` |
| `context/useAuth.ts` | `useAuth()` | Consume el contexto y valida `null` |

`AuthStatus = 'loading' | 'authenticated' | 'anonymous'`. Al montar, `AuthProvider` revalida la cookie
con `GET /auth/me`; los `setState` van **dentro de los callbacks** de la promesa, nunca en el cuerpo
del effect (rompería `react-hooks/set-state-in-effect`). `logout` limpia el estado local en un
`finally`: aunque el backend falle, el cliente queda deslogueado.

### Capa de API

`services/api.ts` es el **único** `fetch` del proyecto. Verificado:
`grep -rn "fetch(" src/` fuera de `api.ts` → **cero resultados**.
`grep -rn "localStorage|sessionStorage" src/` → **cero resultados**.

`ApiError` expone `status` y `data` (el body crudo). `readDetail()` aplana el `detail` array de los 422
a texto legible. Mensajes de red en español rioplatense. `credentials: 'include'` en cada request.

**Deuda menor:** `ApiError` usa `data`, no `detail` como nombre de propiedad. Cosmético.

### NavBar con sesión

`useAuth()` → si hay `user`: muestra `{user.first_name}` y un botón "Cerrar sesión" que llama `logout()`.
Enlaza al `homeForRole(user.role)`.

### Marca

`SaludOnline` → **Clínica Virtual** unificado en UI, aria-labels e `index.html`.
`grep -rn "SaludOnline" frontend/src frontend/index.html` → **cero resultados**.

### Estado de UI

Sin librería de estado global más allá del contexto de auth. Sin TanStack Query, sin cache, sin
optimistic updates. Los componentes de contenido son funciones puras sobre datos de `src/data/`.

---

## 7. Tests

### Backend — 28 tests

| Archivo | Tests | Cubre |
|---|---|---|
| `tests/test_auth.py` | 20 | registro, login, `/me`, logout |
| `tests/test_config.py` | 8 | parseo de config y registro de modelos |

**`test_auth.py` (20):** crea la cuenta · normaliza email a minúsculas · email duplicado falla ·
duplicado no revela que el email existe · password corta · password de 73 bytes · ignora el `role`
del cliente · normaliza nombres · nombre vacío · login OK devuelve sesión y setea cookie · login es
case-insensitive · normaliza email antes de buscar · email inexistente y password incorrecta son
indistinguibles · usuario inactivo da 403 · `/me` con cookie · `/me` sin cookie da 401 · `/me` con
cookie inválida da 401 · logout invalida el acceso · logout sin sesión da 204 · `/me` con usuario
inactivo da 403.

**`test_config.py` (8):** CORS acepta CSV plano · parte múltiples y saca espacios · CORS acepta lista
de Python · `SECRET_KEY` corta falla · `SECRET_KEY` placeholder falla · `cookie_secure` se fuerza en
producción · `cookie_secure` respeta el flag en dev · importar `app.models` registra las tablas.

Los dos últimos casos son **regresiones de bugs reales** encontrados al verificar:
el parseo de `CORS_ORIGINS` y el `__init__.py` vacío.

### Frontend — 9 tests

| Archivo | Tests | Cubre |
|---|---|---|
| `src/pages/__tests__/Login.test.tsx` | 4 | login + redirección |
| `src/routes/__tests__/ProtectedRoute.test.tsx` | 5 | guard de sesión y rol |

**Login (4):** actualiza el contexto y redirige a `/pacientes` con credenciales válidas · vuelve a
`state.from` si `ProtectedRoute` rebotó · muestra mensaje legible con credenciales inválidas · no llama
a `/auth/login` si faltan campos.

**ProtectedRoute (5):** redirige a `/login` y recuerda la ruta pedida si no hay sesión · deja pasar con
sesión y rol permitido · bloquea el rol incorrecto y lo manda a su home · **no hace loop cuando el
home del rol es la misma ruta restringida** · no renderiza la zona privada mientras revalida la cookie.

Infra: `test/setup.ts` (jest-dom), `test/testUtils.ts` (mock de `fetch` y sesión), `environment: jsdom`,
`globals: true`.

### Qué NO cubren los tests

**Backend:**
- Nada contra PostgreSQL. La suite corrió en **SQLite en memoria** (`sqlite://` + `StaticPool`).
  SQLite no tiene `ENUM` nativo ni `ALTER COLUMN`, así que el dialecto real nunca se ejercita.
- **Las migraciones nunca se ejecutan en los tests.** El esquema se arma con `Base.metadata.create_all()`
  en `conftest.py:65`. Un cambio de migración roto pasaría la suite verde.
- No hay tests de `main.py` más allá del health check implícito.
- No hay test de concurrencia / carrera en el registro.
- No hay test de `security.py` aislado (se cubre indirectamente).

**Frontend:**
- No hay tests de `Register`, `NavBar`, `Contact`, `api.ts`, `roleHome` ni de ninguna página.
- No hay test de la ruta real de `App.tsx` (`/pacientes` dentro del árbol completo): los tests usan
  routers de memoria propios.
- No hay ningún test de integración con la API real.

**Integración:**
- Smoke HTTP **manual** hecho en esta auditoría (ver abajo), no automatizado.
- No hay `docker-compose` para el stack de tests.
- No hay CI.

### Resultados de los comandos pedidos

| Comando | Resultado | Detalle |
|---|---|---|
| `pytest` | ✅ **28 passed** | 1 warning: `StarletteDeprecationWarning` (httpx vs `httpx2`) |
| `npm run lint` | ✅ exit 0 | sin warnings |
| `npm run build` | ✅ exit 0 | `tsc -b` + vite 8.3.1, 68 módulos, 370.75 kB (108.20 kB gzip) |
| `npm test` | ✅ **9 passed** | 2 archivos, ~2.5 s |
| `alembic check` | ❌ **exit 255** | Detecta solo el drift de `doctors` |

⚠️ **`pytest` corrió con `PYTHONPATH=/tmp/opencode/vcdeps`.** No hay `venv` en `backend/` ni en el repo;
las dependencias de Python viven en `/tmp/opencode/vcdeps`, que es **efímero**. En Windows hay que
usar el `venv` según el README.

### Smoke HTTP manual (esta auditoría, contra PostgreSQL real)

Servidor `uvicorn` en `127.0.0.1:8766` con el `.env` real (Postgres 17.11):

```
POST /api/auth/register              → 201  {"id":7,...,"role":"PATIENT","is_active":true}
POST /api/auth/login  (pass mala)    → 401  {"detail":"Credenciales inválidas."}
POST /api/auth/login  (email falso)  → 401  {"detail":"Credenciales inválidas."}
POST /api/auth/login  (OK)           → 200  set-cookie: ...; HttpOnly; Max-Age=1800; Path=/; SameSite=lax
GET  /api/auth/me     (sin cookie)   → 401  {"detail":"Sesión inválida o expirada."}
GET  /api/auth/me     (con cookie)   → 200  {...usuario...}
POST /api/auth/logout                → 204  set-cookie: access_token=""; Max-Age=0
GET  /api/auth/me     (post-logout)  → 401
GET  /api/auth/me     (token copiado a mano, post-logout) → 200  ⚠️ stateless
```

La fila `id=7` creada por este smoke **fue eliminada al terminar**; `users` volvió a 2 filas.
El `uvicorn` de auditoría fue detenido (`ss -ltn` confirma que nada escucha en 8765/8766).

### Por qué no se corrieron los tests contra PostgreSQL

`virtual_clinic_test` **no existe** en el servidor (bases presentes: `postgres`, `virtual_clinic`).
`conftest.py` hace `Base.metadata.drop_all()` al terminar y `DELETE FROM` en cada test. Apuntar
`TEST_DATABASE_URL` a `virtual_clinic` habría **borrado las 2 filas reales** de la base de desarrollo.
Por eso no se ejecutó. Crear esa base es un paso explícito para la próxima sesión.

---

## 8. Docker / Infraestructura

### Servicios

| Servicio | Imagen | Container | Puerto host | Expuesto en |
|---|---|---|---|---|
| `postgres` | `postgres:17-alpine` | `virtual-clinic-postgres` | `127.0.0.1:5432 → 5432` | solo loopback |
| `pgadmin` | `dpage/pgadmin4:latest` | `virtual-clinic-pgadmin` | `127.0.0.1:5050 → 80` | solo loopback |

Volumen nombrado: `postgres_data` → `/var/lib/postgresql/data`.
`restart: unless-stopped` en ambos. `pgadmin` espera `postgres` con
`depends_on: condition: service_healthy`.

Todas las variables usan `${VAR:?mensaje}` **sin default**: si falta el `.env` de la raíz, compose falla
con un mensaje explícito en vez de arrancar Postgres con credenciales al azar.

### Estado verificado

| Dato | Valor |
|---|---|
| Docker CLI | presente en `/mnt/c/Program Files/Docker/Docker/resources/bin/docker` |
| **Docker en WSL** | ❌ **no usable**: *"The command 'docker' could not be found in this WSL 2 distro"* |
| Puerto 5432 en WSL | ✅ algo escucha |
| PostgreSQL | ✅ **17.11 alpine, accesible y verificado** (conexión psycopg desde WSL) |
| pgAdmin | no verificado (requiere Docker CLI) |

**Docker corre en Windows, no en WSL**, pero PostgreSQL es alcanzable desde WSL por el port forwarding
de Docker Desktop. Por eso esta auditoría pudo inspeccionar la base real.

### Consistencia de configuración (verificada sin exponer valores)

| Chequeo | Resultado |
|---|---|
| `POSTGRES_USER` raíz == usuario de `DATABASE_URL` | ✅ |
| `POSTGRES_PASSWORD` raíz == password de `DATABASE_URL` | ✅ |
| `POSTGRES_DB` raíz == base de `DATABASE_URL` | ✅ |
| `POSTGRES_PORT` raíz == puerto de `DATABASE_URL` | ✅ |
| `SECRET_KEY` real (no placeholder) | ✅ 43 chars |
| `POSTGRES_HOST` en el `.env` raíz | ⚠️ existe pero `docker-compose.yml` **no lo usa** (inerte) |

`.env.example` no trae valores reales: `change_me` en passwords y `admin@example.com` en pgAdmin.
`SECRET_KEY` del ejemplo es `change_me_genera_una_real_con_secrets_token_urlsafe` y la app lo rechaza.

### Comandos

```bash
docker compose up -d        # levantar
docker compose ps           # estado + healthcheck
docker compose logs -f postgres
docker compose down         # parar (conserva volumen)
docker compose down -v      # parar y BORRAR el volumen
```

**En WSL el prefijo es `docker.exe`** (o usar Docker Desktop integrated terminal), porque el binario
Linux no está disponible.

---

## 9. Migraciones

### Línea de tiempo

```
<base>  →  2a8c31a987b6   →  7f3c1a9b4d21   (head)
```

| Revision | Descripción | down_revision | Estado |
|---|---|---|---|
| `2a8c31a987b6` | `create users table` — `users` con `role VARCHAR(20)`, `created_at`/`updated_at` `DateTime` naive | `None` | ✅ aplicada |
| `7f3c1a9b4d21` | `role as enum and timestamptz timestamps` — convierte a `ENUM`, pasa a `timestamptz`, agrega `server_default`, normaliza roles a mayúsculas | `2a8c31a987b6` | ✅ **aplicada y verificada** |

### HEAD

`7f3c1a9b4d21` — confirmado **en la base real** (`select version_num from alembic_version` → `['7f3c1a9b4d21']`).
`alembic current` → `7f3c1a9b4d21 (head)`.

### La migración "problemática" y qué se reparó

`7f3c1a9b4d21` es la que:+ convierte `users.role` de `VARCHAR(20)` a un enum nativo `user_role`;
  + convierte `created_at`/`updated_at` de `timestamp without time zone` a `timestamptz`;
  + normaliza `'patient'` → `'PATIENT'`.

Reparaciones y Safeguas que se le hicieron:

1. **Guard de valores inesperados.** Antes del cast, consulta los `role` distintos y aborta con un
   `RuntimeError` legible si hay alguno fuera del enum, en vez de reventar a mitad de la migración.
2. **Guard de dialecto.** `if bind.dialect.name != 'postgresql': raise RuntimeError(...)`. Sin esto, en
   SQLite fallaba con `sqlite3.OperationalError: near "ALTER": syntax error`, un error que no dice nada
   útil. El mensaje actual es *"La migracion 7f3c1a9b4d21 solo corre en PostgreSQL, no en sqlite."*
3. **Normalización previa.** `UPDATE users SET role = upper(role)` antes del cast, porque la columna
   guardaba minúsculas y el enum es en mayúsculas.
4. **Skip del chequeo en modo offline.** `if not op.get_context().as_sql:` para que `alembic upgrade
   head --sql` funcione (en offline no hay base contra la que consultar).
5. **Supuesto documentado.** Los timestamps viejos eran `datetime.now()` local *naive*; se reinterpretaban
   con `AT TIME ZONE 'America/Argentina/Buenos_Aires'`. El docstring advierte que si los datos venían
   de otra zona hay que corregir el valor antes de aplicarla.

**Corrección importante respecto a documentación previa:** `AGENTS.md` §Deuda dice *"**Pendiente:**
aplicar la migración contra Postgres real"*. Eso ya **no** es cierto: verifiqué por conexión directa
que la base está en `7f3c1a9b4d21`, el enum `user_role` existe y `created_at`/`updated_at` son
`timestamptz` con `default=now()`. **La migración se aplicó correctamente.** La línea de `AGENTS.md`
quedó desactualizada.

Lo que **sí** sigue pendiente de esa migración: la conversión de timestamps no se puede auditar sin
saber la zona horaria original de los datos previos. Con 2 filas y la tabla creada el 2026-10-01 en
esta misma máquina, el riesgo es bajo.

### Verificación offline del SQL

```bash
alembic upgrade head --sql                              # → EXIT 0
alembic downgrade 7f3c1a9b4d21:2a8c31a987b6 --sql       # → EXIT 0
```

SQL generado para Postgres (upgrade):

```sql
UPDATE users SET role = upper(role) WHERE role <> upper(role);
CREATE TYPE user_role AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN');
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::text::user_role;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'PATIENT';
ALTER TABLE users ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'America/Argentina/Buenos_Aires';
ALTER TABLE users ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'America/Argentina/Buenos_Aires';
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE users ALTER COLUMN is_active SET DEFAULT true;
```

Y el `downgrade` revierte todo, vuelve el role a minúsculas y hace `DROP TYPE user_role`. Ambos
sentidos son correctos y reversibles.

### Migración pendiente

**`doctors`.** La tabla existe en `app/models/doctor.py` pero no hay revisión que la cree.
`alembic check` lo detecta y es el **único** drift del proyecto.Es trivial de resolver
(`alembic revision --autogenerate` la genera limpia) pero es exactamente el tipo de cosa que hay que
hacer en su propio commit.

### `alembic check` detecta drift

**Sí: exit 255**, y reporta únicamente:

```
Detected added table 'doctors'
Detected added index 'ix_doctors_id' on ('id',)
New upgrade operations detected
```

**No hay ningún otro drift.** Ni columnas faltantes, ni tipos distintos, ni defaults distintos.

---

## 10. Funcionalidades Implementadas

| Feature | Estado | Archivos principales | Observaciones |
|---|---|---|---|
| Auth (registro/login/logout/me) | **IMPLEMENTADO** | `routers/auth.py`, `schemas/user.py`, `services/auth.ts`, `pages/Login.tsx`, `pages/Register.tsx` | Verificado por 28 tests + smoke real contra PG. Cookie `httpOnly`. Anti-enumeración y anti-timing OK |
| RBAC | **PARCIAL** | `models/enums.py`, `routes/roleHome.ts`, `routes/ProtectedRoute.tsx` | Enum de 3 roles y guard de rol en el frontend. **Sin helper de rol en el backend.** `DOCTOR`/`ADMIN` inalcanzables |
| Patients | **LEGACY** | `pages/Patients.tsx` | Ruta protegida `/pacientes` ✓ pero el contenido es **marketing** con datos de `data/howItWorks.ts`. Sin datos del paciente |
| Doctors | **NO IMPLEMENTADO** | `models/doctor.py` | Solo el modelo. Sin migración, sin schema, sin router, sin página. `/doctors` no existe como ruta |
| Appointments / Turnos | **NO IMPLEMENTADO** | — | Cero código. No hay modelo, ni migración, ni endpoint |
| Prescriptions / Recetas | **NO IMPLEMENTADO** | — | Cero código |
| Messaging / Mensajes | **NO IMPLEMENTADO** | `pages/Contact.tsx` (parcial) | El form de Contact **valida pero no envía**: muestra "El formulario todavía no está disponible". Le falta `POST /api/contact` |
| Medical records / Historial | **NO IMPLEMENTADO** | — | Cero código |
| Admin | **NO IMPLEMENTADO** | — | `/admin` no existe. No hay forma de crear un ADMIN |
| Health check | **IMPLEMENTADO** | `main.py` | `GET /api/health` |
| Content mock | **LEGACY** | `src/data/*.ts` (6 archivos) | A propósito hasta que haya endpoints reales |
| Professionals (público) | **LEGACY** | `pages/Professionals.tsx`, `sections/ProfessionalsSection.tsx`, `data/professionals.ts` | Marketing con mock. Nomenclatura "professional" pendiente de renombrar |
| Docker | **IMPLEMENTADO** | `docker-compose.yml` | Postgres 17 + pgAdmin, bound a loopback, vars sin default |

---

## 11. Deuda Técnica

### Crítica

Nada que rompa datos ahora mismo. Los tres candidatos más obvios los descarto con evidencia:

1. **Dependencias de auth sin mantenimiento** — `passlib 1.7.4` (abandonado en 2020) +
   `python-jose 3.5.0` (CVE-2024-33663/33664). **Cercania: importante, no crítica** — no hay
   vulnerabilidad explotable conocida en el uso actual (HS256 con `algorithms` fijado), y el plan ya
   está escrito. Pero es la deuda que más probablemente falle en una auditoría de seguridad.
2. **Logout no invalida tokens** — un JWT robado sirve hasta 30 min. **Cercania: importante.**
3. **`SECRET_KEY` no rotable sin invalidar todo** — sin `kid` ni versionado. **Cercania: menor**
   hoy; crítico el día que haya que rotar.

Lo que sí es crítico **de cara al próximo trabajo**:

4. **Sin `.gitattributes`** — 52 archivos aparecen modificados sin cambios reales. **Esto va a
   provocar pérdida de trabajo** si alguien hace `git restore .` con cambios reales mezclados. Es lo
   único que arreglaría antes de seguir.

### Importante

| # | Problema | Evidencia |
|---|---|---|
| 1 | Migración de `doctors` ausente → `alembic check` falla (exit 255) | `alembic check` |
| 2 | `passlib` + `python-jose` sin mantenimiento | `core/security.py`, `docs/auth-libs-migration.md` |
| 3 | Sin denylist de tokens: logout no invalida | smoke: token manual post-logout → 200 |
| 4 | `virtual_clinic_test` no existe → los tests nunca corrieron contra PG | `pg_database` no la lista |
| 5 | Las migraciones no se ejecutan en los tests | `conftest.py:65` usa `create_all` |
| 6 | Sin helper de rol / ownership en el backend | `dependencies.py` solo tiene user/active_user |
| 7 | `ENVIRONMENT` es `str` libre, no `Enum`/`Literal` | `config.py:42` |
| 8 | Sin `pool_pre_ping` en el engine | `database.py:11` |
| 9 | 15 archivos con nomenclatura `professional` | `grep -rln "rofessional" src/` |
| 10 | `docs/` vacío salvo un archivo; sin ADR, sin diagrama, sin contrato de API | `ls docs/` |

### Menor

| # | Problema |
|---|---|
| 1 | `WWW-Authenticate: Bearer` en respuestas de cookie (engañoso) |
| 2 | `allow_methods/headers=["*"]` sobrepermisivo |
| 3 | `updated_at` sin trigger de base (solo `onupdate` de SQLAlchemy) |
| 4 | `ApiError.data` en vez de `.detail` |
| 5 | Docstring de `conftest.py` dice "SQLite en archivo"; es en memoria |
| 6 | `POSTGRES_HOST` inerte en el `.env` raíz |
| 7 | `App.css` junto a `index.css`: ¿se usa? |
| 8 | `pytest` con `StarletteDeprecationWarning` (httpx vs `httpx2`) |
| 9 | `role` es `UNIQUE INDEX`, no constraint (funciona, pero `information_schema` no lo lista) |
| 10 | `.gitignore` sin `frontend/.env.local`, `.vite/`, `*.tsbuildinfo` |

### Documentación desactualizada (verificado)

- `AGENTS.md` §Deuda: dice que la migración `7f3c1a9b4d21` está **pendiente de aplicar a Postgres**.
  **Ya está aplicada y verificada.**
- `AGENTS.md` §Estructura: menciona `database/` y `tests/` en la raíz; **no existen**.
- `AGENTS.md` §Estructura: no menciona `frontend/src/context/`, `routes/`, `test/`.
- `AGENTS.md` §Rutas y README §Estructura: el README menciona `AuthLayout` como archivo propio; se
  exporta desde `layouts/MainLayout.tsx`.
- `AGENTS.md` §3: se contradice a sí mismo sobre si `/doctors` o `/pacientes` es la ruta canónica.
- **No existe un roadmap numerado (Prompt 0/1/2/3) en ningún documento.** La única referencia es
  `README.md:195`: *"mock de professionals, specialties, faqs (hasta Prompt 4)"*. Ver [§13](#13-roadmap-actual).

---

## 12. Riesgos

### Datos

| Riesgo | Evidencia | Impacto | Recomendación |
|---|---|---|---|
| **La suite contra PG borraría la base de desarrollo** | `conftest.py` `drop_all` + `DELETE FROM` en cada test; `virtual_clinic_test` no existe | **Pérdida total de los datos de dev** si alguien exporta `TEST_DATABASE_URL` mal | Crear `virtual_clinic_test` y dejar el nombre hardcodeado en la documentación. Considerar un guard en `conftest.py` que rechace una URL cuyo nombre de base no termine en `_test` |
| `IntegrityError` en registro duplicado | `auth.py:73-79`: `SELECT` y luego `INSERT`, sin `try/except IntegrityError` | Con dos registros concurrentes del mismo email, el `UNIQUE` revienta → **500 con traceback** | `try/except IntegrityError` → 400 genérico |

### Migraciones

| Riesgo | Evidencia | Impacto | Recomendación |
|---|---|---|---|
| **Migraciones nunca ejercitadas por los tests** | `conftest.py:65` usa `create_all` | Una migración rota pasa la suite verde y revienta en producción | Un test que corra `alembic upgrade head` contra una DB efímera en CI |
| Migración de `doctors` ausente | `alembic check` exit 255 | Un deploy que aplique migraciones no crea `doctors`; si el código empieza a usarla, falla en runtime | Generarla en su propio commit |
| `updated_at` sin trigger de base | `information_schema` muestra `default=now()` sin trigger | Updates por SQL crudo no actualizan `updated_at` | Trigger, o aceptar y documentar que solo SQLAlchemy lo mantiene |
| `UNIQUE` como índice y no constraint | `pg_indexes` | `ON CONFLICT (email)` funciona, pero herramientas que leen `table_constraints` no lo ven | Sin acción; es válido |

### Autenticación

| Riesgo | Evidencia | Impacto | Recomendación |
|---|---|---|---|
| **Token válido sobrevive al logout** | smoke: `Cookie: access_token=<copiado>` post-logout → **200** | Una sesión robada sirve hasta `ACCESS_TOKEN_EXPIRE_MINUTES` (30) | Denylist (Redis/tabla) o tokens versionados por usuario. Alternativa barata:giros muy cortos + refresh |
| `passlib` / `python-jose` sin mantenimiento | `requirements.in` | CVE-2024-33663/33664; `bcrypt` pineado a 4.0.1 como parche | Migrar a PyJWT + pwdlib (`docs/auth-libs-migration.md`) |
| `SECRET_KEY` única y sin `kid` | `core/security.py:43` | Rotarla invalida **todas** las sesiones de golpe, sin transición | Versionar la clave (`kid` en el header) cuando se nears deploy |
| Login de inactivo devuelve 403 vs 401 | `auth.py:127` | El **status** sí revela que la cuenta existe (aunque el mensaje no) | Aceptable: exige conocer la contraseña correcta. Si importa, unificar a 401 |

### Autorización

| Riesgo | Evidencia | Impacto | Recomendación |
|---|---|---|---|
| **Cero checks de rol en el backend** | `dependencies.py` solo tiene `get_current_user`/`get_current_active_user` | Hoy inofensivo (no hay endpoints de dominio). **Al agregar el primer endpoint con `user_id` hay que construir RBAC desde cero** | `require_roles(...)` en `core/` **antes** del primer endpoint de dominio |
| **Loop `home ⇄ /` para DOCTOR/ADMIN** | `roleHome.ts` devuelve `/doctors` y `/admin`; `App.tsx` no las declara; el `*` rebota a `/` | Alcanzable en cuanto se creen esos roles | Crear las páginas o mapear a una ruta existente mientras tanto |
| Frontend como única barrera en `/pacientes` | `App.tsx:38` | Bajo: `/pacientes` no expone datos. Alto en cuanto muestre turnos | Mantener la regla de `AGENTS.md` §4 |

### Seguridad

| Riesgo | Evidencia | Impacto | Recomendación |
|---|---|---|---|
| Sin rate limit en `/auth/login` | No hay middleware | Fuerza bruta ilimitada. `DUMMY_PASSWORD_HASH` incluso iguala el costo | Rate limit por IP/email antes de exponer a internet |
| `DUMMY_PASSWORD_HASH` se hashea **al importar** el módulo | `auth.py:37` | Un `bcrypt` (~250 ms) en el arranque de cada worker | Moverlo a `functools.lru_cache` perezoso |
| pgAdmin con `SERVER_MODE=False` | `docker-compose.yml` | Credenciales en la URL. Mitigado: bound a `127.0.0.1` | Aceptable en dev; nunca exponer |
| CORS `allow_headers=["*"]` | `main.py` | Superficie innecesaria | Restringir a `Content-Type` |
| Sin helmet / headers de seguridad | `main.py` | Sin `X-Content-Type-Options`, etc. | Agregar middleware cuando haya reverse proxy |

### Concurrencia

| Riesgo | Evidencia | Impacto | Recomendación |
|---|---|---|---|
| Carrera check-then-insert en registro | `auth.py:73` vs `:89` | `IntegrityError` → 500 | `try/except IntegrityError` |
| `DUMMY_PASSWORD_HASH` recalculado por worker | `auth.py:37` | Cada worker paga el costo al importar | `lru_cache` |

### Integridad referencial

| Riesgo | Evidencia | Impacto | Recomendación |
|---|---|---|---|
| `doctors.user_id → users.id` solo en código | La tabla no existe | Ninguno hoy | Se resuelve al generar la migración |
| Sin `ON DELETE` en la FK de `doctors` | `models/doctor.py` define la FK sin `ondelete` | Borrar un usuario con perfil de doctor fallará por FK | Decidir la política antes de migrar (`RESTRICT` o `CASCADE`) |

### Frontend / Backend mismatch

| Riesgo | Evidencia | Impacto | Recomendación |
|---|---|---|---|
| Contrato duplicado a mano | `services/auth.ts` `Session` vs `schemas/user.py` `UserResponse` | Un cambio de campo rompe en runtime, no en compile | Derivar el tipo del OpenAPI |
| `frontend/.env` `VITE_API_URL` no matchea `backend` CORS | `CORS_ORIGINS` default `localhost:5173` | Si el front corre en otro puerto, CORS bloquea la cookie silenciosamente | Mantener ambos alineados; el error es confuso |
| Nomenclatura `professional` vs `Doctor` | 15 archivos | Confusión constante; contradice `AGENTS.md` §3 | Renombrar en una rama dedicada |

### Docker

| Riesgo | Evidencia | Impacto | Recomendación |
|---|---|---|---|
| Docker no usable desde WSL | `docker` no encontrado en la distro | Comandos de compose fallan en WSL | Usar `docker.exe` o la terminal integrada |
| `POSTGRES_HOST` inerte | `.env` raíz vs compose | Confusión; alguien puede confiar en que hace algo | Borrarlo o usarlo |
| `POSTGRES_PORT` configurable pero `DATABASE_URL` fija `5432` | `.env` raíz y `backend/.env` | Cambiar el puerto rompe la conexión del backend en silencio | Documentar que hay que cambiar los dos, o parametrizar |
| `postgres:17-alpine` sin digest | `docker-compose.yml` | Un rebuild puede traer una 17.x distinta | Fijar digest si importa la reproducibilidad |

### Deployment

| Riesgo | Evidencia | Impacto | Recomendación |
|---|---|---|---|
| Sin CI | No hay `.github/workflows` | Nada se verifica solo en un push | Pipeline con lint + typecheck + tests |
| Sin `Dockerfile` para backend/frontend | `find` no lo encuentra | El despliegue es manual | Containerizar |
| `CORS_ORIGINS` hardcodeado a dev | default `localhost:5173` | En producción hay que acordarse de cambiarlo | Validar que no apunte a localhost cuando `ENVIRONMENT=production` |
| `COOKIE_SECURE` no validado en prod | `cookie_secure` fuerza `True`, correcto | — | — |
| Sin health check en el compose del backend | solo hay `/api/health`, sin Docker | — | Agregar cuando exista imagen |

---

## 13. Roadmap Actual

### Estado de los "Prompt N"

⚠️ **No existe un roadmap numerado verificable en `AGENTS.md` ni en ningún documento del repo.**
La búsqueda de `prompt [0-9]`, `roadmap`, `fase [0-9]` en `AGENTS.md`, `README.md` y `docs/` devuelve
**un solo hit**: `README.md:195`, *"mock de professionals, specialties, faqs (hasta Prompt 4)"*.

Lo que sí se puede reconstruir desde el código, en orden de dependencia:

```
Prompt 0  →  Base del proyecto (repo, compose, .gitignore, .env.example)
              IMPLEMENTADO   commits e8dac32 "Updated repo", 3f6c42f "Updated frontend"

Prompt 1  →  Backend inicial + modelos User
              IMPLEMENTADO   commits 8a18cb7 "started backend", 0ec86c6 "updated register functionality"

Prompt 2  →  Registro funcional
              IMPLEMENTADO   commit 0ec86c6; hoy reforzado con cookie, validaciones y anti-enumeración

Prompt 3  →  Auth completo (login/logout/me) + RBAC
              IMPLEMENTADO   commit ece29aa; frontend con AuthProvider + ProtectedRoute

Prompt 4  →  Endpoints reales que reemplazan src/data/ (mock)
              NO IMPLEMENTADO  sigue siendo mock: contact, faqs, howItWorks,
                               professionals, specialties, values (6 archivos)

Prompt 5+ →  ?  NO DOCUMENTADO
```

Lo que **no** está en ningún roadmap pero ya existe: toda la capa de estabilización
(config con pydantic-settings, requirements pinneados, Alembic 2 revisiones, pytest, Vitest, README).

### Secuencia técnica restante propuesta

Respetando *una feature por rama*, *un commit por prompt*, *tests antes del merge* y
*merge a main solo cuando esté estable*. **No se implementa nada de esto aquí.**

**Rama 1 — `chore/normalize-line-endings`** (sin feature, previene pérdida de trabajo)
1. Agregar `.gitattributes`: `* text=auto eol=lf`.
2. `git add --renormalize .` en un commit aislado.
3. Verificar que `git status` quede limpio.
4. Correr la suite completa antes y después.

**Rama 2 — `feat/02-doctors-migration`**
1. `alembic revision --autogenerate -m "create doctors table"`.
2. Decidir `ondelete` de `doctors.user_id` **antes** de aplicar.
3. Test de integración que corra `alembic upgrade head` contra una DB efímera.
4. Criterio de éxito: `alembic check` sale **0**.

**Rama 3 — `chore/auth-libraries`**
1. Swap `python-jose` → `PyJWT` y `passlib` → `pwdlib` según `docs/auth-libs-migration.md`.
2. Rehashear contraseñas existentes (o columna de grace period).
3. Tests: mismo comportamiento, sin cambios observables.

**Rama 4 — `feat/03-test-db-postgres`**
1. Crear `virtual_clinic_test`.
2. Guard en `conftest.py` que rechace una `TEST_DATABASE_URL` cuyo nombre no termine en `_test`.
3. Correr la suite contra PG real. Este es el paso que **desbloquea** verificar migraciones en tests.

**Rama 5 — `feat/04-rbac-backend`**
1. `require_roles(...)` en `core/`.
2. Tests de rol por endpoint.
3. Recién después, los primeros endpoints de dominio.

**Rama 6 en adelante — features de negocio** (appointments, prescriptions, messaging, records),
una por rama, empezando por reemplazar `src/data/professionals.ts`.

**Cross-cutting, cuando toque producción:** rate limit en login, denylist de tokens ogiros cortos,
`ENVIRONMENT` como `Literal`, `pool_pre_ping`, CI, `Dockerfile`s, CORS restringido.

---

## 14. NEXT ACTION

### 1. Rama desde la que continuar

`main`, **después** de crear y mergear `chore/normalize-line-endings`.
`feat/01-estabilizar` ya está fusionada y apuntando al mismo commit: no usarla.

### 2. Próximo prompt recomendado

**"Normalizar fin de línea con `.gitattributes` y dejar el working tree limpio"**
(chore, sin feature de producto). Es el único ítem de deuda **crítica**: hoy
`git status` muestra 52 archivos modificados que son ruido, y cualquier `git restore .`
en la próxima feature tiraría trabajo real.

### 3. Objetivo

Que `git status` sea confiable: agregar política de normalización de fin de línea, renormalizar
el árbol una sola vez, y comprobar que el resultado es semánticamente idéntico.

### 4. Archivos que probablemente toque

- **Nuevo:** `.gitattributes`
- **Modificados por renormalización:** los 52 que hoy aparecen con CRLF (todo `backend/app/**`,
  todo `frontend/src/**`, `README.md`, `AGENTS.md`, `docker-compose.yml`, `requirements*.txt`,
  los `.env.example`)
- **Posible:** `AGENTS.md` §Deuda, para corregir la línea que dice que la migración
  `7f3c1a9b4d21` está pendiente de aplicar (ya está aplicada y verificada)

### 5. Precondiciones

- `git status` revisado a mano para confirmar que no hay cambios reales escondidos entre el ruido
  (`git diff --ignore-cr-at-eol` debe dar vacío — **ya verificado: lo está**).
- Working tree sin nada sin commitear que valga la pena. **Ya verificado: no hay untracked.**
- No crear la rama hasta confirmar el paso 1.

### 6. Tests que deben pasar

```
cd backend  → pytest                          → 28 passed
cd frontend → npm run lint                    → exit 0
cd frontend → npx tsc -b                      → exit 0
cd frontend → npm test                        → 9 passed
cd frontend → npm run build                   → exit 0
cd backend  → alembic check                   → exit 255 (esperado: sigue faltando doctors)
```

El `alembic check` **debe seguir fallando** en este prompt. Si empieza a pasar sin tocar migraciones,
algo cambió mal.

### 7. Riesgos específicos de este prompt

- **Un `git add --renormalize .` sobreescribe contenido real si se mezcló con el ruido.** Por eso el
  paso 5 es obligatorio.
- OneDrive puede volver a convertir a CRLF si el archivo se resincroniza. Si el problema reaparece,
  el `.gitattributes` no basta y hay que sacar el repo de la carpeta sincronizada.
- `git add --renormalize` marca el repo entero: el commit va a ser grande. Eso es correcto y
  esperado, pero hay que hacerlo **solo**, sin mezclarlo con cambios funcionales.

### 8. Criterio de "DONE"

- [ ] `.gitattributes` existe con `* text=auto eol=lf`.
- [ ] `git status` sale **completamente limpio**.
- [ ] `git diff --stat HEAD~1` muestra solo cambios de fin de línea (verificable con
      `git diff --ignore-cr-at-eol HEAD~1 HEAD` → vacío).
- [ ] Los 6 comandos de test de arriba pasan con los mismos números.
- [ ] `alembic check` sigue en exit 255.
- [ ] El commit está en `main` y pusheado.
- [ ] `git config core.autocrlf` documentado en el README para Windows.

---

## 15. Comandos Útiles

Todos en **PowerShell** (Windows), salvo indicación. Los de backend y frontend exigen estar en su carpeta.

### Verificar Git

```powershell
git status
git status --porcelain
git diff --stat
git diff --stat --ignore-cr-at-eol     # reveals si el diff es solo CRLF
git log --oneline -10
git log --oneline --all --graph --decorate
git branch -vv
git fetch origin
git diff origin/main --stat
```

### Levantar Docker

```powershell
cd C:\ruta\al\virtual-clinic
copy .env.example .env      # la primera vez; puede pedir confirmacion
docker compose up -d
docker compose ps
docker compose logs -f postgres
docker compose down
docker compose down -v      # BORRA el volumen postgres_data
```

> En WSL el docker de Linux no está: usar `docker.exe compose ...` o la terminal
> integrada de Docker Desktop.

### Levantar backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
copy .env.example .env      # la primera vez: completar DATABASE_URL y SECRET_KEY
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

Generar un `SECRET_KEY` válido (la app lo exige, mínimo 32 chars):

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### Levantar frontend

```powershell
cd frontend
copy .env.example .env      # la primera vez
npm install
npm run dev
```

### Tests

```powershell
# Backend: default (SQLite en memoria)
cd backend; pytest

# Backend: contra Postgres (CREAR LA BASE PRIMERO, ver seccion 7)
docker compose exec postgres createdb -U clinic_user virtual_clinic_test
$env:TEST_DATABASE_URL = "postgresql+psycopg://clinic_user:<PASS>@localhost:5432/virtual_clinic_test"
pytest

# Frontend
cd frontend; npm test
npm run test:watch
npm run lint
npx tsc -b
npm run build
```

> ⚠️ La base de tests se borra entera entre casos. `TEST_DATABASE_URL` **nunca** debe apuntar a
> `virtual_clinic`.

### Alembic (desde `backend/`)

```powershell
alembic current
alembic history
alembic check                                    # 255 hoy: falta la migracion de doctors
alembic upgrade head
alembic downgrade -1
alembic revision --autogenerate -m "mensaje"
alembic upgrade head --sql                       # genera el SQL sin tocar la base
```

### Ramas

```powershell
git switch -c chore/normalize-line-endings      # crear
git switch main                                 # volver a main
git switch -c feat/xx-nombre                    # feature nueva desde main
git branch -d feat/xx-nombre                    # borrar ya mergeada
```

### Merge

```powershell
git switch main
git pull
git merge --no-ff feat/xx-nombre
git push origin main
git push origin --delete feat/xx-nombre
```

### Push

```powershell
git push -u origin <rama>
git push origin main
git push --force-with-lease     # solo si el commit ya fue pusheado y se reescribio
```

### Recompilar el lock de Python (desde `backend/`)

```powershell
pip install pip-tools
pip-compile requirements.in        # regenera requirements.txt; nunca editarlo a mano
```

---

## Resumen ejecutivo

- **Estado:** base sólida y verificada. Auth completo funcionando sobre PostgreSQL 17.11 real.
- **Rama:** `main`, sin trabajo sin commitear. Todo pusheado a `origin/main`.
- **Commit:** `ece29aa` *feat: stabilize application foundation*.
- **Tests:** `pytest` **28 passed** · `npm run lint` exit 0 · `npx tsc -b` exit 0 ·
  `npm test` **9 passed** · `npm run build` exit 0 · **`alembic check` exit 255** (falta `doctors`).
- **Migraciones:** 2 revisiones, HEAD `7f3c1a9b4d21`, **aplicada y verificada en la base real**
  (`AGENTS.md` la marca pendiente: está desactualizado).
- **Base real:** tablas `users` y `alembic_version`; enum `user_role` y `timestamptz` confirmados;
  2 filas en `users`. `doctors` no existe en ningún lado salvo en el modelo.
- **⚠️ 52 archivos "modificados" = puro CRLF, cero cambios de contenido.** Sin `.gitattributes`.
- **Deuda crítica real:** la normalización de fin de línea (riesgo de perder trabajo). No hay
  problemas de datos activos.
- **Deuda importante:** `passlib`/`python-jose` sin mantenimiento · logout no invalida tokens ·
  sin RBAC en el backend · `virtual_clinic_test` no existe (los tests nunca corrieron contra PG) ·
  las migraciones no se ejercitan en los tests.
- **Funcionalidad:** solo Auth + health. Todo lo demás (`/doctors`, `/admin`, turnos, recetas,
  mensajes, historial) es NO IMPLEMENTADO. `/pacientes` es LEGACY: marketing con mock.
- **Próximo paso:** `.gitattributes` + renormalizar en `chore/normalize-line-endings`, para que
  `git status` vuelva a ser confiable antes de tocar feature alguna.
