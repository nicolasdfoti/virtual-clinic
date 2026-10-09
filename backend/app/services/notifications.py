from typing import Any


class ConsoleNotifier:
    """Notificador para desarrollo. Se reemplaza en la Fase 9."""

    def send(self, event: str, payload: dict[str, Any]) -> None:
        # No envia a ningun lado: queda registrado en logs? Mejor no loguear
        # datos de salud. Solo es un placeholder inofensivo.
        _ = event, payload


# Instancia usada en tiempo de ejecucion
notifier = ConsoleNotifier()


def send(event: str, payload: dict[str, Any]) -> None:
    notifier.send(event, payload)
