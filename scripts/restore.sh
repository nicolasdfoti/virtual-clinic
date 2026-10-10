#!/usr/bin/env bash
# Restore script for virtual-clinic
# Usage: ./scripts/restore.sh <backup_date> [output_dir]
# Example: ./scripts/restore.sh 20261010_120000

set -euo pipefail

# Configuración
DB_NAME="${POSTGRES_DB:-virtual_clinic}"
DB_USER="${POSTGRES_USER:-virtual_clinic}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
STORAGE_DIR="${STORAGE_DIR:-./storage}"
BACKUP_DIR="${2:-./backups}"
BACKUP_DATE="${1:-}"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# Validar argumentos
if [ -z "$BACKUP_DATE" ]; then
    log_error "Uso: $0 <backup_date> [backup_dir]"
    log_error "Ejemplo: $0 20261010_120000"
    exit 1
fi

DB_DUMP_FILE="$BACKUP_DIR/db_${DB_NAME}_${BACKUP_DATE}.sql.gz"
STORAGE_BACKUP_FILE="$BACKUP_DIR/storage_${BACKUP_DATE}.tar.gz"
CHECKSUM_FILE="$BACKUP_DIR/checksums_${BACKUP_DATE}.sha256"

log_info "Restaurando backup de fecha: $BACKUP_DATE"
log_info "Directorio de backup: $BACKUP_DIR"

# Verificar archivos
for f in "$DB_DUMP_FILE" "$STORAGE_BACKUP_FILE" "$CHECKSUM_FILE"; do
    if [ ! -f "$f" ]; then
        log_error "Archivo no encontrado: $f"
        exit 1
    fi
done

# Verificar checksums
log_info "Verificando checksums..."
cd "$BACKUP_DIR"
if sha256sum -c "checksums_${BACKUP_DATE}.sha256"; then
    log_info "Checksums OK"
else
    log_error "Checksums no coinciden! Backup corrupto."
    exit 1
fi

# Restaurar base de datos
log_info "Restaurando base de datos..."
log_warn "Esto ELIMINARÁ todos los datos actuales en la base de datos $DB_NAME"
read -p "¿Continuar? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    log_info "Restauración cancelada"
    exit 0
fi

# Terminar conexiones existentes
log_info "Terminando conexiones activas..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" 2>/dev/null || true

# Recrear base de datos
log_info "Recreando base de datos..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" 2>/dev/null || true
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";" || {
    log_error "Error al crear base de datos"
    exit 1
}

# Restaurar dump
log_info "Restaurando dump..."
if gunzip -c "$DB_DUMP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -q; then
    log_info "Base de datos restaurada correctamente"
else
    log_error "Error al restaurar base de datos"
    exit 1
fi

# Restaurar almacenamiento
log_info "Restaurando directorio de almacenamiento..."
if [ -f "$STORAGE_BACKUP_FILE" ]; then
    log_warn "Esto ELIMINARÁ el contenido actual de $STORAGE_DIR"
    read -p "¿Continuar? (yes/no): " CONFIRM
    if [ "$CONFIRM" = "yes" ]; then
        rm -rf "$STORAGE_DIR"
        mkdir -p "$STORAGE_DIR"
        tar -xzf "$STORAGE_BACKUP_FILE" -C "$(dirname "$STORAGE_DIR")"
        log_info "Almacenamiento restaurado correctamente"
    else
        log_info "Restauración de almacenamiento omitida"
    fi
else
    log_warn "No hay backup de almacenamiento para restaurar"
fi

# Ejecutar migraciones (por si el schema cambió)
log_info "Ejecutando migraciones Alembic..."
cd /app && alembic upgrade head || log_warn "Error en migraciones (revisar manualmente)"

log_info "=== RESTAURACIÓN COMPLETADA ==="
log_info "Base de datos: $DB_NAME"
log_info "Almacenamiento: $STORAGE_DIR"

exit 0