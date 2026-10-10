# virtual-clinic - Guía de Despliegue y Runbook

## Índice
1. [Requisitos previos](#requisitos-previos)
2. [Configuración](#configuración)
3. [Despliegue con Docker Compose](#despliegue-con-docker-compose)
4. [Health Checks](#health-checks)
5. [Backups y Restauración](#backups-y-restauración)
6. [Monitoreo y Logs](#monitoreo-y-logs)
7. [Runbook de Incidentes](#runbook-de-incidentes)
8. [Actualizaciones](#actualizaciones)

---

## Requisitos previos

- Docker Engine 24+
- Docker Compose 2.20+
- 2 GB RAM mínimo (4 GB recomendado)
- 10 GB disco libre
- Dominio con certificado SSL (Let's Encrypt o similar)
- Puertos 80, 443, 5432, 6379 accesibles

---

## Configuración

1. Copiar archivo de entorno:
```bash
cp .env.example .env
```

2. Editar `.env` con valores reales:
- `POSTGRES_PASSWORD`: contraseña segura para BD
- `SECRET_KEY`: generar con `python -c "import secrets; print(secrets.token_urlsafe(48))"`
- `CORS_ORIGINS`: tu dominio real (ej: `https://clinica.example.com`)
- `POSTGRES_PASSWORD`: contraseña BD

⚠️ **NUNCA commitear `.env` a git**

---

## Despliegue con Docker Compose

### Producción
```bash
# Construir e iniciar
docker compose up -d --build

# Ver logs
docker compose logs -f api

# Ver estado
docker compose ps
```

### Desarrollo
```bash
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d --build
```

### Primer despliegue (migraciones)
```bash
# Las migraciones se ejecutan automáticamente al iniciar
# Verificar:
docker compose logs api | grep -i alembic
```

---

## Health Checks

| Servicio | Endpoint | Intervalo |
|----------|----------|-----------|
| API | `GET /api/health` | 30s |
| DB | `pg_isready` | 10s |
| Redis | `redis-cli ping` | 10s |

Verificar:
```bash
curl https://tu-dominio.com/api/health
# {"status":"ok","message":"API funcionando correctamente","service":"clinica-virtual-api"}
```

---

## Backups y Restauración

### Backup automático (cron diario)
```bash
# Agregar a crontab (root):
0 2 * * * /app/scripts/backup.sh /backups >> /var/log/backup.log 2>&1
```

### Backup manual
```bash
./scripts/backup.sh /backups
```

### Restauración
```bash
# Listar backups disponibles
ls /backups/

# Restaurar
./scripts/restore.sh 20261010_120000
```

### Verificar integridad
```bash
cd /backups
sha256sum -c checksums_20261010_120000.sha256
```

### Retención
- Por defecto: 30 días (configurable con `BACKUP_RETENTION_DAYS`)
- Almacenamiento en `/backups` (montar volumen persistente)

---

## Monitoreo y Logs

### Logs de la aplicación
```bash
# Tiempo real
docker compose logs -f api

# Últimas 100 líneas
docker compose logs --tail=100 api

# Filtrar errores
docker compose logs api | grep -i error
```

### Logs de BD
```bash
docker compose logs db
```

### Métricas clave a monitorear
- CPU / RAM de contenedores: `docker stats`
- Espacio en disco: `df -h`
- Conexiones BD: `SELECT count(*) FROM pg_stat_activity WHERE datname='virtual_clinic';`
- Latencia API: monitorear `/api/health` latencia p95 < 200ms

---

## Runbook de Incidentes

### 1. API no responde (5xx / timeout)
```bash
# 1. Verificar contenedor
docker compose ps api

# 2. Ver logs
docker compose logs --tail=200 api

# 3. Reiniciar
docker compose restart api

# 4. Si persiste, revisar BD
docker compose logs db
```

### 2. Base de datos no disponible
```bash
# Verificar contenedor
docker compose ps db

# Ver logs
docker compose logs db

# Reiniciar
docker compose restart db

# Si corrupción: restaurar desde backup
./scripts/restore.sh <fecha_backup>
```

### 3. Rate limiting bloqueando usuarios legítimos
```bash
# Ver logs de rate limit
docker compose logs api | grep "429"

# Ajustar límites en app/core/rate_limit.py
# Reiniciar: docker compose restart api
```

### 4. Certificado SSL expirado
```bash
# Renovar (Certbot)
certbot renew --nginx

# Recargar nginx
docker compose exec nginx nginx -s reload
```

### 5. Espacio en disco lleno
```bash
# Ver uso
df -h
docker system df

# Limpiar
docker system prune -a --volumes
# O borrar backups antiguos
find /backups -mtime +30 -delete
```

### 6. Migración fallida
```bash
# Ver estado
docker compose exec api alembic current

# Reintentar
docker compose exec api alembic upgrade head

# Si falla: revertir
docker compose exec api alembic downgrade -1
```

---

## Actualizaciones

### Código
```bash
# 1. Pull cambios
git pull origin main

# 2. Rebuild
docker compose build --no-cache api

# 3. Deploy con zero-downtime (rolling)
docker compose up -d --no-deps --build api
```

### Base de datos (migraciones)
```bash
# Las migraciones corren automáticamente al iniciar
# Forzar:
docker compose exec api alembic upgrade head
```

### Dependencias
```bash
# Backend
cd backend
pip-compile requirements.in
docker compose build --no-cache api

# Frontend
cd frontend
npm update
docker compose build --no-cache frontend
```

---

## Seguridad

### Checklist post-despliegue
- [ ] `.env` no está en git
- [ ] `SECRET_KEY` única y larga (>32 chars)
- [ ] `COOKIE_SECURE=true` en producción
- [ ] `CORS_ORIGINS` solo dominios permitidos
- [ ] `COOKIE_SECURE=true` y `SECURE` en nginx
- [ ] Backups programados y probados
- [ ] Logs no contienen DNI/emails/datos clínicos
- [ ] Rate limiting activo en auth/upload
- [ ] Headers CSP/HSTS activos
- [ ] Backups cifrados en reposo (opcional)

---

## Contacto y Escalamiento

| Severidad | Tiempo respuesta | Contacto |
|-----------|------------------|----------|
| Crítica (servicio caído) | 15 min | DevOps on-call |
| Alta (funcionalidad rota) | 1 hora | Equipo backend |
| Media (degradado) | 4 horas | Equipo backend |
| Baja (mejora) | Próximo sprint | Equipo producto |

---

## Referencias
- [Docker Compose docs](https://docs.docker.com/compose/)
- [PostgreSQL Backup](https://www.postgresql.org/docs/current/backup.html)
- [Redis Persistence](https://redis.io/docs/management/persistence/)
- [Alembic Migrations](https://alembic.sqlalchemy.org/)