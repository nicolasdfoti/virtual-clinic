# Prompts

Un archivo por prompt: `NN-nombre.md`, donde `NN` es el ID de
[`docs/ROADMAP.md`](../ROADMAP.md).

Ejemplos: `0.2-secret-key-environment.md`, `2.3-rbac-rutas.md`.

> **Estado actual:** esta carpeta tiene solo el índice. Los prompts `0.2` a
> `10.1` **todavía no están escritos**; se van pegando a medida que se
> ejecutan.

---

## Por qué los prompts viven en el repo

La serie anterior (`e8dac32`, `3f6c42f`, `8a18cb7`, `0ec86c6`) **nunca tuvo un
artefacto de planificación**. Lo único que sobrevive es media línea en
`README.md:195` ("hasta Prompt 4"). Reconstruir qué se pidió y por qué obliga a
leer 9.000 líneas de diff.

Un prompt pegado en un chat se pierde. Un prompt en el repo:

- Es revisable en un pull request.
- Sobrevive al cambio de herramienta, de modelo o de persona.
- Obliga a declarar el alcance antes de escribir código.

---

## Reglas para escribir un prompt

1. **Máximo ~400 líneas de diff de producción.** Si no entra, se parte en dos
   (`AGENTS.md` §3).
2. **Vertical slice, no capa.** Cada prompt entrega algo usable o verificable
   de punta a punta.
3. **Contexto con archivos y líneas exactas.** No "revisá el auth", sino
   `backend/app/routers/auth.py:73`.
4. **Alcance cerrado.** La lista de archivos a crear y modificar, y una lista
   explícita de lo que queda fuera.
5. **Criterios de aceptación ejecutables.** El comando y su salida esperada,
   nunca "asegurarse de que funcione".
6. **Prohibido cambiar comportamiento no pedido.** Si el prompt es de refactor,
   el output funcional tiene que ser idéntico (`AGENTS.md` §5.1).
7. **Prohibido commitear.** Salvo pedido explícito (`AGENTS.md` §5.6).
8. **Nada de migraciones y features en el mismo prompt.**

---

## Plantilla

Copiar tal cual. Las secciones entre `<!-- -->` son comentarios: sacarlas del
archivo final.

````markdown
# <ID> — <Título>

| | |
|---|---|
| **Clasificación** | `BLOQUEANTE` \| `PRERREQUISITO` \| `NECESARIO PARA FEATURE <X>` \| `INDEPENDIENTE` \| `MEJORA POSTERIOR` |
| **Depende de** | <IDs de prompts, o "—"> |
| **Rama sugerida** | `<NN>-<descripcion-corta>` |
| **Estado** | `pendiente` |

**Entrega:** <qué puede hacer un humano al terminar, en una frase>

---

## Contexto

<!-- Estado real, con rutas y líneas. Qué existe hoy y por qué. -->

## Decisiones previas

<!-- Reglas de AGENTS.md que apliquen, y decisiones de prompts anteriores que
     este prompt NO debe romper. -->

## Alcance

**Crear:**
- `<ruta>`

**Modificar:**
- `<ruta>` — <qué cambia y por qué>

**Fuera de alcance:**
- <lo que explícitamente no se toca, para evitar que se expanda>

## Reglas

<!-- Invariantes. Ej.: el frontend nunca es la barrera de seguridad; cero fetch
     fuera de services/api.ts; toda feature trae tests. -->

## Verificación

<!-- Obligatorio. Reportar la salida real, no "funciona". -->

```bash
# Desde backend/
pytest                       # esperado: N passed
alembic check                # esperado: sin drift
```

```bash
# Desde frontend/
npm run lint                 # esperado: exit 0
npx tsc -b                   # esperado: exit 0
npm test                     # esperado: N passed
npm run build                # esperado: exit 0
```

## Entregables

- **Tests:** <casos concretos a cubrir, no "agregar tests">
- **Migraciones:** <si aplica, con el plan de rollback>
- **Documentación:** <qué `.md` actualizar,incluido el estado en ROADMAP.md>

## Resumen final

<!-- Ver AGENTS.md §5.5. -->

- Archivos creados / modificados / eliminados (con ruta)
- Decisiones y por qué
- Tests ejecutados y conteo real
- Pendientes y riesgos
````

---

## Checklist antes de pegar un prompt

- [ ] El ID existe en `docs/ROADMAP.md` y todas sus dependencias están `hecho`.
- [ ] El diff estimado entra en ~400 líneas de producción.
- [ ] Hay al menos un criterio de aceptación que falla hoy y passa después.
- [ ] La lista de tests nombra casos concretos.
- [ ] Si toca migraciones, incluye el plan de rollback.
- [ ] No incluye `git commit`, `git push` ni cambio de rama.

---

## Al terminar un prompt

1. Actualizá la fila en `docs/ROADMAP.md` (estado + fecha).
2. Si el prompt se desvió del plan, **anotá el desvío en el archivo del
   prompt**, no en un chat.
3. Si descubriste deuda nueva, agregala a la tabla de
   "Deuda conocida" de `AGENTS.md` o al próximo prompt que la pueda absorber.
