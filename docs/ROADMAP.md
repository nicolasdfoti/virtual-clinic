# ROADMAP — Clínica Virtual

Roadmap canónico del proyecto. **La fuente de verdad del estado del desarrollo
es esta tabla**, no el historial de commits ni un chat.

- Detalle de cada prompt: `docs/prompts/<ID>-<nombre>.md` (ver [`docs/prompts/README.md`](prompts/README.md)).
- Reglas de trabajo: [`AGENTS.md`](../AGENTS.md).
- Auditoría del estado actual: [`docs/PROJECT_HANDOFF.md`](PROJECT_HANDOFF.md).

---

## Cómo se usa

1. Elegí el primer prompt **pendiente** cuyas dependencias estén todas **hechas**.
2. Copiá el prompt de `docs/prompts/` y pegalo como mensaje.
3. Actualizá la fila de este archivo al terminar (estado + fecha).
4. El agente **no commitea** salvo que se lo pidas (ver `AGENTS.md` §5.6).

Nunca saltees una dependencia "porque es rápida": los prompts bloqueantes
existen porque el error que previenen aparece tarde y cara.

---

## Convenciones

**Estados**

| Estado | Significado |
|---|---|
| `pendiente` | No empezado |
| `en curso` | Empezado, no terminado |
| `hecho` | Terminado **y verificado** (tests + lint + typecheck + build en verde) |
| `descartado` | Se decidió no hacerlo.requiere una nota con el motivo |

**Clasificaciones**

| Clasificación | Significado |
|---|---|
| `BLOQUEANTE` | Hay que hacerlo antes de la primera feature de dominio. Defecto real de seguridad, integridad de datos o de verificación |
| `PRERREQUISITO` | Sin esto, ninguna feature posterior es verificable por terceros (CI, cobertura) |
| `NECESARIO PARA FEATURE X` | Requisito de una feature concreta. No bloquea otras |
| `INDEPENDIENTE` | No depende de ninguna feature. Se puede adelantar |
| `MEJORA POSTERIOR` | Conveniente, no urgente. Riesgo acotado oizational |

**Fases**

| Fase | Objetivo |
|---|---|
| **0** | Estabilización: cerrar los defectos que hoy son reales |
| **1** | Verificación continua: CI y cobertura |
| **2** | Fundaciones de dominio: tiempo, modelo, autorización |
| **3** | Vertical slice de referencia: directorio de doctores |
| **4** | Turnos: disponibilidad, modelo, API, booking |
| **5** | Portal del paciente |
| **6** | Administración e invitaciones |
| **7** | Portal del médico |
| **8** | Dominio clínico: historia, recetas, mensajería, estudios |
| **9** | Operación: sesión, logging, despliegue |
| **10** | Auditoría final de cierre |

---

## Reglas de ejecución

1. **Máximo ~400 líneas de diff de producción por prompt.** Si no entra, se
   parte en dos (ver `AGENTS.md` §3). El commit `3f6c42f` hizo 7.688 líneas y
   produjo deuda que nadie vio hasta meses después.
2. **Un prompt, una rama, un commit.** Rama `NN-corto-descripcion`.
3. **Vertical slice, no capa.** Cada prompt entrega algo que un humano puede
   usar o verificar de punta a punta. "Backend de doctores" sin consumidor es
   un ladrillo de avance, no una feature.
4. **Toda feature trae tests.** Backend `pytest`, frontend `Vitest`. Sin test no
   hay feature terminada (`AGENTS.md` §5.2).
5. **Reportar los comandos ejecutados con su salida real**, no "funciona"
   (`AGENTS.md` §5.3).
6. **Nada de migraciones y features en el mismo prompt.** Se mezclan los
   caminos de rollback.
7. **No cambiar comportamiento funcional en un prompt de refactor**
   (`AGENTS.md` §5.1).

---

## Hitos previos

Trabajo que **no pertenece a la serie de prompts** y quedó fuera de toda
planificación. Es el punto de partida de esta roadmap.

| ID | Título | Clasificación | Depende de | Estado | Fecha |
|---|---|---|---|---|---|
| `H1` | Estabilización: config tipada, auth con anti-enumeración, tests, RBAC frontend, infra con guardas, `AGENTS.md` | `BLOQUEANTE` | — | `hecho` | 2026-10-03 |

Commit: `ece29aa feat: stabilize application foundation` (3.947 líneas).

Commits anteriores, **sin prompt documentado**: `e8dac32`, `3f6c42f`,
`8a18cb7`, `0ec86c6`. La reconstrucción de esa serie está en
`PROJECT_HANDOFF.md` §13.

---

## Tabla de prompts

| ID | Título | Clasificación | Depende de | Estado | Fecha |
|---|---|---|---|---|---|
| `0.1` | Git y docs | `BLOQUEANTE` | — | `en curso` | 2026-10-03 |
| `0.2` | Endurecer `SECRET_KEY` / `ENVIRONMENT` | `BLOQUEANTE` | `0.1` | `pendiente` | — |
| `0.3` | Cerrar 500 y test de logout honesto | `BLOQUEANTE` | `0.1` | `pendiente` | — |
| `0.4` | Guard de base de test + Postgres | `BLOQUEANTE` | `0.1` | `pendiente` | — |
| `0.5` | Alembic env y engine | `BLOQUEANTE` | `0.1` | `pendiente` | — |
| `0.6` | TypeScript estricto y código muerto | `BLOQUEANTE` | `0.1` | `pendiente` | — |
| `0.7` | Auth del frontend robusta | `BLOQUEANTE` | `0.2`, `0.3` | `pendiente` | — |
| `1.1` | CI | `PRERREQUISITO` | `0.4`, `0.5` | `pendiente` | — |
| `1.2` | Cobertura | `PRERREQUISITO` | `1.1` | `pendiente` | — |
| `2.1` | Tiempo y timezone | `BLOQUEANTE` | `0.5` | `pendiente` | — |
| `2.2` | Modelo de dominio | `BLOQUEANTE` | `0.5`, `2.1` | `pendiente` | — |
| `2.3` | RBAC y rutas por rol | `BLOQUEANTE` | `2.2`, `0.7` | `pendiente` | — |
| `3.1` | API de doctores | `NECESARIO PARA FEATURE "directorio"` | `2.2`, `2.3` | `pendiente` | — |
| `3.2` | Frontend de doctores | `NECESARIO PARA FEATURE "directorio"` | `3.1` | `pendiente` | — |
| `3.3` | Home honesto y recortado | `NECESARIO PARA FEATURE "directorio"` | `3.2` | `pendiente` | — |
| `4.1` | Disponibilidad | `NECESARIO PARA FEATURE "turnos"` | `2.2`, `2.1` | `pendiente` | — |
| `4.2` | Modelo `Appointment` | `NECESARIO PARA FEATURE "turnos"` | `4.1` | `pendiente` | — |
| `4.3` | API de turnos | `NECESARIO PARA FEATURE "turnos"` | `4.2`, `2.3` | `pendiente` | — |
| `4.4` | UI de booking | `NECESARIO PARA FEATURE "turnos"` | `4.3`, `3.2` | `pendiente` | — |
| `5.1` | Shell y rutas del paciente | `NECESARIO PARA FEATURE "portal del paciente"` | `0.7`, `2.3` | `pendiente` | — |
| `5.2` | Dashboard del paciente | `NECESARIO PARA FEATURE "portal del paciente"` | `5.1`, `4.3` | `pendiente` | — |
| `6.1` | API de admin e invitaciones | `NECESARIO PARA FEATURE "administración"` | `2.3` | `pendiente` | — |
| `6.2` | UI de admin | `NECESARIO PARA FEATURE "administración"` | `6.1` | `pendiente` | — |
| `7.1` | Portal del médico | `NECESARIO PARA FEATURE "portal del médico"` | `2.3` | `pendiente` | — |
| `7.2` | UI de disponibilidad | `NECESARIO PARA FEATURE "portal del médico"` | `7.1`, `4.1` | `pendiente` | — |
| `7.3` | Calendario | `NECESARIO PARA FEATURE "portal del médico"` | `7.2` | `pendiente` | — |
| `8.1` | Historia clínica | `NECESARIO PARA FEATURE "dominio clínico"` | `3.1` | `pendiente` | — |
| `8.2` | API de recetas | `NECESARIO PARA FEATURE "dominio clínico"` | `3.1` | `pendiente` | — |
| `8.3` | PDF y UI de recetas | `NECESARIO PARA FEATURE "dominio clínico"` | `8.2` | `pendiente` | — |
| `8.4` | Mensajería | `INDEPENDIENTE` | `3.1` | `pendiente` | — |
| `8.5` | Estudios | `NECESARIO PARA FEATURE "dominio clínico"` | `8.1` | `pendiente` | — |
| `9.1` | Sesión y rate limit | `MEJORA POSTERIOR` | `9.3` | `pendiente` | — |
| `9.2` | Reset de password y verificación | `INDEPENDIENTE` | `0.2` | `pendiente` | — |
| `9.3` | Migrar librerías de auth | `MEJORA POSTERIOR` | `0.2`, `0.3` | `pendiente` | — |
| `9.4` | Logging y operación | `MEJORA POSTERIOR` | `1.1` | `pendiente` | — |
| `9.5` | Despliegue | `MEJORA POSTERIOR` | `9.1`, `9.4` | `pendiente` | — |
| `10.1` | Auditoría final | `MEJORA POSTERIOR` | `8.5`, `9.5` | `pendiente` | — |

---

## Grafo de dependencias

```
0.1 ─┬─→ 0.2 ─┬─→ 0.7 ─┐
     ├─→ 0.3 ─┘        │
     ├─→ 0.4 ─→ 1.1 ─→ 1.2        │
     ├─→ 0.5 ─┬─→ 2.1 ─→ 2.2 ─→ 2.3 ─┬─→ 3.1 → 3.2 → 3.3
     │        │        ↑              │
     │        └────────┘              ├─→ 4.1 → 4.2 → 4.3 → 4.4
     │                               ├─→ 5.1 → 5.2
     ├─→ 0.6                         ├─→ 6.1 → 6.2
     │                               ├─→ 7.1 → 7.2 → 7.3
     │                               └─→ 8.1 → 8.5
     │                                      └─→ 8.2 → 8.3
     │                                                     └─→ 8.4
     └──────────────────────────────────────────→ 9.3 → 9.1 ─┐
                                              9.4 ───────────┼─→ 9.5 ─┐
                                              9.2 (indep.)   │        ├─→ 10.1
```

Rutas críticas (sin holgura): `0.1 → 0.4 → 1.1 → 1.2` y
`0.1 → 0.5 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2 → 3.3`.

---

## Notas y supuestos

### Estado real al 2026-10-03

Verificado sobre el código, la base y la suite. Los IDs de esta tabla que
resuelven estos problemas:

| Problema verificado | Prompt |
|---|---|
| El `SECRET_KEY` de ejemplo **es aceptado** por la app (el guard solo rechaza `change_me`/`changeme`, y el valor de `backend/.env.example` tiene 51 caracteres) → tokens forjables | `0.2` |
| `ENVIRONMENT` no se valida: `prod`, `Production` o `produccion` dejan `cookie_secure=False` en producción | `0.2` |
| `POST /api/auth/login` con password de >4096 bytes devuelve **500** en vez de 401 | `0.3` |
| `IntegrityError` en `/register` bajo concurrencia devuelve **500** (TOCTOU en `auth.py:73`) | `0.3` |
| `test_logout_invalida_el_acceso` no testea lo que su nombre dice: el JWT sigue válido después del logout | `0.3`, `9.1` |
| `tests/conftest.py` borra **todas** las tablas sin verificar que `TEST_DATABASE_URL` sea una base de test | `0.4` |
| `alembic/env.py` revienta si la password de la BD contiene `%` (`set_main_option` + interpolación de ConfigParser) | `0.5` |
| `alembic/env.py` importa los modelos a mano en vez de `import app.models`; `compare_server_default` no está activo | `0.5` |
| `create_engine` sin `pool_pre_ping` | `0.5` |
| No hay `"strict": true` en ningún `tsconfig`: el typecheck no protege nada | `0.6` |
| Código muerto: `App.css`, `Divider`, `CardHeader/Title/Description/Content/Footer` | `0.6` |
| Doble landmark `<main>` en Login y Register; `api.ts` puede mostrarle "Internal Server Error" al usuario; sin manejo central de 401 | `0.7` |
| La tabla `doctors` no tiene migración (`alembic check` falla) | `2.2` |
| `Role` es decorativo: **no existe ningún helper de autorización** | `2.3` |
| `/doctor/*` y `/admin/*` no existen, y `ROLE_HOME` manda a esas rutas: un DOCTOR cae en la home sin explicación | `2.3` |
| Los 6 mocks de `frontend/src/data/` definen la forma del dominio en vez de al revés | `3.2`, `3.3` |
| 141 ocurrencias de "professional" contra la regla "la entidad es `Doctor`" | `3.2` |

### Supuestos declarados

- **`7f3c1a9b4d21` figura como aplicada pero NO se pudo re-verificar** en la
  corrida que escribió este archivo: el stack de Docker estaba caído
  (`virtual-clinic-postgres` y `virtual-clinic-pgadmin` detenidos; el volumen
  `virtual-clinic_postgres_data` sigue intacto). Confirmar con
  `alembic current` desde `backend/`.
- **La tabla `doctors` tampoco se pudo re-verificar.** Por
  `PROJECT_HANDOFF.md` §4 se sabe que no existía, y por eso `2.2` la incluye.
- **La lista de esta roadmap es la canónica.** Reemplaza la serie
  "Prompt 0-4" inferida de `PROJECT_HANDOFF.md` §13, que era una
  reconstrucción a partir de commits, no un documento.
- **Los textos de los prompts 0.2 a 10.1 todavía no existen.** Van en
  `docs/prompts/`, uno por archivo, con la plantilla de ese README.

### Discrepancias abiertas con `AGENTS.md`

| Tema | `AGENTS.md` | Realidad |
|---|---|---|
| Estado de `7f3c1a9b4d21` | `A VERIFICAR` | Sin Postgres no se puede confirmar en esta corrida |
| Migración de `doctors` | `2.2` la cubre | Sin Postgres no se puede confirmar si el drift sigue |
| Rutas privadas | `/patient/*` canónico | Hoy existe `/pacientes`; la migración la hace `5.1` |
| `docs/ROADMAP.md` | Referenciado desde `AGENTS.md` §3 | Este archivo |
