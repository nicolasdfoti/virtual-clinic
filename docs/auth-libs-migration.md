# Migración del stack de auth: python-jose + passlib → PyJWT + pwdlib

Estado: **evaluado, NO aplicado.** Decidido diferirlo para no mezclar el
cambio de librería con la estabilización de la base.

## Qué hay hoy

| Pieza | Librería | Problema |
|---|---|---|
| JWT | `python-jose==3.5.0` | Sin mantenimiento activo (el repo quedó archivado en 2023). |
| Passwords | `passlib==1.7.4` | Sin mantenimiento desde 2020. |

El síntoma visible del problema de passlib: hay que pinear `bcrypt==4.0.1`.
Con bcrypt 4.1+ passlib 1.7.4 rompe al leer `bcrypt.__about__`, que fue
eliminado. Es un cepo de dependencia que se va a repetir cada vez que se
actualice bcrypt.

## Opciones evaluadas

### 1. PyJWT + pwdlib (recomendada)

- `PyJWT` mantiene y actualiza los JWT; la API para `encode`/`decode` es
  casi idéntica a la de `python-jose`, así que el cambio es mecánico.
- `pwdlib` es el sucesor mantenido de passlib, con la misma interfaz
  (`PasswordHash.recommended()`), pensado explícitamente para no quedar
  atado a la versión de bcrypt que exista.

Ventaja: se elimina el pin de bcrypt y las dos libs quedan mantenidas.
Costo: dos cambios de API en `app/core/security.py`, que es el módulo que
toca todo el flujo de auth.

### 2. PyJWT + `bcrypt` directo

- Menos dependencias, pero hay que reimplementar a mano el chequeo de los
  72 bytes de bcrypt que hoy hace pydantic en `UserCreate`, y hay que
  manejar el error de versión de bcrypt que-originó el pin.
- Más código propio que mantener a cambio de poco.

### 3. Quedarse como está

- Cero riesgo inmediato, pero el pin de bcrypt sigue ahí y las dos libs
  quedan sin soporte.

## Qué habría que cambiar

- `backend/requirements.in`: sacaría `passlib[bcrypt]` y `python-jose`,
  agregaría `PyJWT` y `pwdlib[argon2,bcrypt]`.
- `backend/app/core/security.py`: `pwd_context` pasa a `PasswordHash` y
  `jwt.encode/decode` cambia de import.
- `backend/tests/`: los tests de `create_access_token` / `decode_access_token`
  deberían seguir pasando sin cambios (esa es la prueba de que el
  comportamiento se preservó).

Los 20 tests actuales de `tests/test_auth.py` ya cubren login, logout, `/me`,
token expirado, firma adulterada y enumeración de emails, que es exactamente
la superficie que un swap de librería podría romper. Cuando se haga el cambio,
`pytest` en verde es el criterio de aceptación.