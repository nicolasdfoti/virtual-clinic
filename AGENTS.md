# Reglas del proyecto virtual-clinic

- Idioma: identificadores, rutas de API y nombres de tablas en inglés; textos de UI, errores de API y comentarios en español rioplatense. Rutas del frontend: /app, /app/medico, /app/admin.
- Stack backend: FastAPI + SQLAlchemy 2 + Alembic + PostgreSQL. Frontend: React 19 + React Router 7 + Tailwind 4 + TypeScript + Vite + Vitest. No agregues dependencias sin justificarlas en el resumen final. Desarrollo en Windows con "Control de aplicaciones": preferí wheels puras y avisá si una dependencia compila extensiones.
- Esquema: TODO cambio va con migración Alembic. Nunca create_all fuera de los tests. `alembic upgrade head` sobre base vacía debe dejar el esquema igual a los modelos.
- Autorización: cada endpoint nuevo exige autenticación y chequea rol Y pertenencia del recurso. Recurso ajeno = 404 (no 403). Nunca decidas permisos con ids que manda el cliente. El frontend oculta cosas por UX; la seguridad real es del backend.
- Datos de salud: nunca en logs, mensajes de error, URLs ni en /auth/me. DNI y obra social solo en endpoints específicos.
- Contenido público: prohibido inventar médicos, matrículas, reseñas, precios, fotos o promesas de servicio que la plataforma no cumple.
- Tests: cada endpoint nuevo con éxito, 401, 403/404 (otro rol, otro paciente) y validación. En el frontend, tests con Vitest + Testing Library reutilizando src/test/testUtils.ts. Corré lint, tests y build (`npm run lint && npm test && npm run build`) antes y después.
- Alcance: hacé solo lo que pide el prompt; lo que detectes fuera de alcance, listalo al final.
- Entrega: resumen con archivos tocados, cómo probar a mano, decisiones tomadas y pendientes. No hagas commit.
- Tiempos: horas y franjas siempre en zona America/Argentina/Buenos_Aires.
- Login: nunca habilitar enumeración de emails (misma respuesta y mismo timing para email inexistente y contraseña incorrecta).
- Entrega: un vertical slice por prompt; no mezclar cambios de esquema (migraciones) con features.