# Plan de fases — Clínica Virtual

Plan canónico consolidado a partir del `docs/analysis/ANALISIS_2026-10-08.md`
(sección §8). La decisión del dueño fue recrear este plan como `docs/virtual-clinic-plan`
y reconciliar `AGENTS.md` con las reglas que faltaran.

- Estado actual del proyecto, según la auditoría del **2026-10-08**: el backend solo
  tiene auth sólida y el frontend es una landing de marketing con cero funcionalidad
  de dominio. Todo lo de dominio (doctores, turnos, portal paciente, administración,
  recetas) está **sin empezar**. El proyecto está en la **fase 0**.
- Regla de trabajo transversal: **nada de migraciones y features juntas en el mismo
  prompt**, y cada entrega es un *vertical slice* (algo usable de punta a punta).
- Pendientes de decisión del dueño al final (preguntas 1–9 heredadas de la auditoría);
  las tareas legales requieren validación profesional y no constituyen dictamen.

---

## Fase 0 — Saneamiento y fundaciones (S, 1–3 semanas)

| ID | Tarea | Tamaño | Evidencia |
|---|---|---|---|
| 0.1 | Este plan documento canónico (`docs/virtual-clinic-plan`) | S | working tree, auditoría §8 |
| 0.2 | Migración Alembic para `doctors` + comprobar `upgrade head` sobre base vacía = modelos | S | auditoría H10 |
| 0.3 | Endurecer `SECRET_KEY`/`ENVIRONMENT` (rechazar placeholder, validar `production`) | S | `config.py` |
| 0.4 | Cerrar 500/errores: login con password gigante, TOCTOU de register | S | auditoría §5 |
| 0.5 | `pool_pre_ping` + `alembic/env.py` con `import app.models` y `compare_server_default` | S | auditoría §3.4 |
| 0.6 | Guard de base de test: abortar si `TEST_DATABASE_URL` no parece de test | S | `conftest.py` |
| 0.7 | TS `strict:true` + borrar dead code (`App.css`, `Divider`, Card* no usados) | S | auditoría §6.2 |
| 0.8 | `api.ts`: Content-Type condicional, método `patch`, interceptor global de 401 | S | auditoría H7 |
| 0.9 | `homeForRole` sin áreas → redirigir con aviso; quitar el doble `<main>` | S | auditoría H5, H6 |
| 0.10 | Limpiar `frontend.zip`, `zifOaZg0`, `.gitignore` | S | auditoría H9 |

## Fase 1 — Verificación continua (S, 1–2 semanas) — depende 0.4, 0.5

| ID | Tarea | Tamaño |
|---|---|---|
| 1.1 | CI (GitHub Actions): lint + test + build backend y frontend, alembic check | S |
| 1.2 | Coverage configurado (backend `coverage`, frontend `@vitest/coverage-v8`) | S |

## Fase 2 — Fundaciones de dominio + RBAC (S, 2–3 semanas) — depende 0.2, 0.5, 1.1

| ID | Tarea | Tamaño | Nota |
|---|---|---|---|
| 2.1 | Modelo de tiempo/timezone (franjas, `America/Argentina/Buenos_Aires`) | S | precedente: la zona ya usada en `7f3c1a9b4d21` |
| 2.2 | Helper RBAC `require_roles(...)` (403 para rol incorrecto, 404 para recurso ajeno) + tests | S | `dependencies.py` |
| 2.3 | Bootstrap de admin: comando `create-admin` protegido por entorno (nunca por el body) | S | auditoría H10 |
| 2.4 | Endpoints base protegidos + regla "recurso ajeno = 404" con tests por rol | S | AGENTS.md |

## Fase 3 — Vertical slice: directorio real (M, 2–4 semanas) — depende 2.2, 2.4 y [1.1, 1.2]

| ID | Tarea | Tamaño |
|---|---|---|
| 3.1 | API pública de doctores (lista/perfil con datos reales desde `doctors`) | S |
| 3.2 | Frontend de directorio conectado a la API (reemplaza `data/professionals.ts`) | M |
| 3.3 | Home "honesta": quitar médicos/rating/precios/reseñas inventados y promesas | M |

## Fase 4 — Turnos y booking (M, 3–5 semanas) — depende 3.2, 2.2, 2.1

| ID | Tarea | Tamaño |
|---|---|---|
| 4.1 | Disponibilidad (franjas + bloqueos) | M |
| 4.2 | Modelo `Appointment` + conflicto/overlap, validación de pertenencia (404) | M |
| 4.3 | API de turnos (book/cancelar/reprogramar) con rate limit | M |
| 4.4 | UI de booking | M |

## Fase 5 — Portal del paciente (M, 2–4 semanas) — depende 4.3, 2.2

| ID | Tarea | Tamaño |
|---|---|---|
| 5.1 | Shell y rutas `/app` (paciente), `/app/medico`, `/app/admin` según mapa | S |
| 5.2 | Dashboard del paciente (próximos turnos, historial) con estado honesto | M |
| 5.3 | Perfil privado con DNI/obra social **solo en endpoint dedicado** | S |

## Fase 6 — Administración (M, 2–4 semanas) — depende 2.3, 2.2

| ID | Tarea | Tamaño |
|---|---|---|
| 6.1 | API admin (alta de médicos, total de pacientes con filtros, actividad) | M |
| 6.2 | UI admin | M |

## Fase 7 — Portal del médico (M, 3–5 semanas) — depende 6.1, 4.3

| ID | Tarea | Tamaño |
|---|---|---|
| 7.1 | Dashboard médico (lista de pacientes del doctor, perfil solo lectura) | M |
| 7.2 | Disponibilidad del médico (UI) | S |
| 7.3 | Calendario | M |

## Fase 8 — Dominio clínico (L, 4–8 semanas) — depende 3.1 (para adjuntos), 7.x

| ID | Tarea | Tamaño | Legal |
|---|---|---|---|
| 8.1 | Historia clínica (modelo + acceso por titular/equipo) | L | Ley 26.529 |
| 8.2 | API de recetas/órdenes | M | Ley 27.553 |
| 8.3 | PDF (template) + UI de recetas/órdenes | M | — |
| 8.4 | Mensajería / consulta virtual (cifrado E2E real o no prometerlo) | L | — |
| 8.5 | Consentimiento informado de teleconsulta | S | — |

## Fase 9 — Operación (M, 2–4 semanas) — depende 1.1

| ID | Tarea | Tamaño |
|---|---|---|
| 9.1 | Rate limit global + sesiones (revocación) + CSRF si aplica | M |
| 9.2 | Reset de password / verificación de email (y no prometerlo antes) | M |
| 9.3 | Migrar a PyJWT + pwdlib | S |
| 9.4 | Logging sin datos sensibles | S |
| 9.5 | Despliegue (HTTPS, cookies Secure, HSTS) | M |

## Fase 10 — Auditoría final (S) — depende de 8.x y 9.x

| ID | Tarea | Tamaño |
|---|---|---|
| 10.1 | Re-auditoría (chequeo de H1–H10, revisión legal, prueba de punta a punta) | S |

**Rutas críticas (sin holgura):** `0.2→2.2→3.1→3.2→3.3` y `0.4/0.5→1.1→1.2`.
Sin CI no debería avanzarse a la fase 3.

---

## Preguntas abiertas para el dueño (heredadas de la auditoría §9)

1. **Contenido público rojo**: ¿eliminar perfiles/precios/reseñas/rating inventados
   de una (dejando especialidades genéricas) o hay un listado real que conectar?
2. **Teleconsulta**: ¿videollamada/pagos reales o consultoría offline primero?
3. **Verificación de email / notificaciones**: ¿hay un proveedor SMTP elegido?
4. **Bootstrap de admin**: ¿comando CLI (como `create-admin`) o endpoint con secreto?
5. **Recetas electrónicas**: ¿cumplir Ley 27.553 desde el inicio o "PDF informativo"
   diferenciado para no engañar?
6. **Persona legal / dominio**: ¿cuál es el canal oficial real (mail, dirección)?
7. **Prioridad**: ¿saneamiento + CI (fases 0–1) o una feature punta a punta rápido?
8. **Windows / "Control de aplicaciones"**: seguir prefiriendo wheels puras y avisar
   si una dependencia compila extensiones.
9. **Docs borrados**: ¿restaurar/adaptar `ROADMAP.md`, `PROJECT_HANDOFF.md`,
   `auth-libs-migration.md` y `prompts/` (en HEAD) o descartarlos a favor de este plan?