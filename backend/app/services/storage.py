"""Backend de almacenamiento para PDFs generados.

Guarda archivos en STORAGE_DIR (fuera de lo servido estaticamente),
con nombres UUID y registra SHA256. Preparado para migracion a S3.
"""
from __future__ import annotations

import hashlib
import os
import uuid
from pathlib import Path
from typing import BinaryIO, Optional

from app.core.config import get_settings


settings = get_settings()


class StorageBackend:
    """Almacenamiento local de archivos con integridad SHA256.

    Los archivos se guardan en STORAGE_DIR/{año}/{mes}/<uuid>.pdf
    No se sirven directamente por el servidor web; el acceso
    siempre pasa por endpoints autenticados que streaman el archivo.
    """

    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or settings.STORAGE_DIR).resolve()
        # Asegurar que existe
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _make_path(self, filename: str) -> Path:
        """Genera ruta organizada por año/mes."""
        now = __import__("datetime").datetime.now()
        year = now.strftime("%Y")
        month = now.strftime("%m")
        dir_path = self.base_dir / year / month
        dir_path.mkdir(parents=True, exist_ok=True)
        return dir_path / filename

    def save(self, content: bytes, filename: Optional[str] = None) -> tuple[str, str]:
        """Guarda bytes y devuelve (ruta_relativa, sha256).

        Args:
            content: Contenido binario a guardar.
            filename: Nombre opcional. Si no se da, usa UUID.

        Returns:
            Tupla (ruta_relativa_desde_base, sha256_hex).
        """
        if filename is None:
            filename = f"{uuid.uuid4()}.pdf"
        elif "." not in Path(filename).name:
            # Sin extension explicita se asume PDF (comportamiento historico).
            # Con extension se respeta: los archivos de paciente usan .jpg/.png.
            filename = f"{filename}.pdf"

        sha256 = hashlib.sha256(content).hexdigest()

        # Evitar duplicados: si ya existe un archivo con mismo hash, reutilizar
        # Nota: simple check por nombre; para deduplicacion real se necesita DB
        file_path = self._make_path(filename)
        # El nombre puede traer subcarpetas (ej. "prescriptions/1.pdf").
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(content)

        # Ruta relativa a base_dir para guardar en BD
        rel_path = file_path.relative_to(self.base_dir)
        return str(rel_path), sha256

    def save_stream(self, stream: BinaryIO, filename: Optional[str] = None) -> tuple[str, str]:
        """Guarda desde un stream (ej: request.files)."""
        content = stream.read()
        return self.save(content, filename)

    def get_path(self, relative_path: str) -> Path:
        """Devuelve Path absoluto a partir de ruta relativa guardada en BD."""
        return (self.base_dir / relative_path).resolve()

    def exists(self, relative_path: str) -> bool:
        """Verifica si el archivo existe."""
        return self.get_path(relative_path).exists()

    def delete(self, relative_path: str) -> bool:
        """Elimina archivo. Devuelve True si se borro."""
        try:
            self.get_path(relative_path).unlink(missing_ok=True)
            return True
        except Exception:
            return False

    def open(self, relative_path: str) -> BinaryIO:
        """Abre archivo en modo lectura binaria."""
        return self.get_path(relative_path).open("rb")

    def get_sha256(self, relative_path: str) -> str:
        """Calcula SHA256 del archivo almacenado."""
        h = hashlib.sha256()
        with self.open(relative_path) as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()


# Instancia global por defecto
storage = StorageBackend()