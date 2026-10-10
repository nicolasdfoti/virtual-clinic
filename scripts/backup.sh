#!/usr/bin/env bash
# Backup script for virtual-clinic
# Usage: ./scripts/backup.sh [output_dir]

set -euo pipefail

# Configuración
DB_NAME="${POSTGRES_DB:-virtual_clinic}"
DB_USER="${POSTGRES_USER:-virtual_clinic}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
STORAGE_DIR="${STORAGE_DIR:-./storage}"
BACKUP_DIR="${1:-./backups}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# Crear directorio de backup
mkdir -p "$BACKUP_DIR"

log_info "Iniciando backup de virtual-clinic..."
log_info "Fecha: $DATE"
log_info "Directorio de backup: $BACKUP_DIR"

# 1. Backup de base de datos (pg_dump)
DB_DUMP_FILE="$BACKUP_DIR/db_${DB_NAME}_${DATE}.sql.gz"
log_info "Ejecutando pg_dump..."
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --no-owner --no-privileges --clean --if-exists \
    | gzip > "$DB_DUMP_FILE"; then
    log_info "Backup de BD completado: $DB_DUMP_FILE"
else
    log_error "Error en pg_dump"
    exit 1
fi

# 2. Backup de archivos de almacenamiento (STORAGE_DIR)
STORAGE_BACKUP_FILE="$BACKUP_DIR/storage_${DATE}.tar.gz"
log_info "Comprimiendo directorio de almacenamiento: $STORAGE_DIR"
if [ -d "$STORAGE_DIR" ]; then
    if tar -czf "$STORAGE_BACKUP_FILE" -C "$(dirname "$STORAGE_DIR")" "$(basename "$STORAGE_DIR")"; then
        log_info "Backup de almacenamiento completado: $STORAGE_BACKUP_FILE"
    else
        log_error "Error al comprimir almacenamiento"
        exit 1
    fi
else
    log_warn "Directorio de almacenamiento no existe: $STORAGE_DIR (se omite)"
fi

# 3. Generar checksums
log_info "Generando checksums SHA256..."
cd "$BACKUP_DIR"
sha256sum "db_${DB_NAME}_${DATE}.sql.gz" "storage_${DATE}.tar.gz" > "checksums_${DATE}.sha256" 2>/dev/null || true
log_info "Checksums generados: checksums_${DATE}.sha256"

# 4. Limpieza de backups antiguos
log_info "Limpiando backups mayores a $RETENTION_DAYS días..."
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR" -type f -name "*.sha256" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
log_info "Limpieza completada"

# Resumen
log_info "=== BACKUP COMPLETADO ==="
log_info "Base de datos: $DB_DUMP_FILE"
[ -f "$STORAGE_BACKUP_FILE" ] && log_info "Almacenamiento: $STORAGE_BACKUP_FILE"
log_info "Checksums: $BACKUP_DIR/checksums_${DATE}.sha256"
log_info "Espacio usado:"
du -sh "$BACKUP_DIR"/*${DATE}* 2>/dev/null | sort -h

exit 0