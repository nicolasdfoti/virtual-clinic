"""Matriz de autorizacion: verifica que TODAS las rutas /api estan declaradas.

Esta prueba falla si:
- Hay una ruta /api sin declarar en AUTH_MATRIX
- Hay una ruta declarada en AUTH_MATRIX que no existe en la app

Los status codes por rol se testean en los tests especificos de cada endpoint
(test_auth.py, test_prescriptions.py, etc.). Este test solo asegura cobertura completa.
"""
import re
import pytest

from app.main import app


# Rutas /api declaradas con sus metodos HTTP.
# Solo para cobertura: el test verifica que no falte ninguna ruta.
# Los status codes por rol se testean en los tests unitarios de cada feature.
AUTH_MATRIX = {
    "/api/auth/login": {"methods": ["POST"]},
    "/api/auth/register": {"methods": ["POST"]},
    "/api/auth/logout": {"methods": ["POST"]},
    "/api/auth/me": {"methods": ["GET"]},
    "/api/auth/password": {"methods": ["PATCH"]},
    "/api/public/doctors": {"methods": ["GET"]},
    "/api/patients/me/profile": {"methods": ["GET", "PUT"]},
    "/api/patients/me/files": {"methods": ["GET", "POST"]},
    "/api/patients/me/files/999/download": {"methods": ["GET"]},
    "/api/patients/me/clinical-notes": {"methods": ["GET"]},
    "/api/doctor/patients": {"methods": ["GET", "POST"]},
    "/api/doctor/patients/999": {"methods": ["GET"]},
    "/api/doctor/patients/999/prescriptions": {"methods": ["GET", "POST"]},
    "/api/doctor/patients/999/prescriptions/999/cancel": {"methods": ["PATCH"]},
    "/api/doctor/patients/999/orders": {"methods": ["GET", "POST"]},
    "/api/doctor/patients/999/orders/999/cancel": {"methods": ["PATCH"]},
    "/api/doctor/patients/999/clinical-notes": {"methods": ["GET", "POST"]},
    "/api/doctor/patients/999/clinical-notes/999/amend": {"methods": ["POST"]},
    "/api/doctor/patients/999/files": {"methods": ["GET", "POST"]},
    "/api/doctor/patients/999/files/999/download": {"methods": ["GET"]},
    "/api/doctor/appointments/999": {"methods": ["GET"]},
    "/api/doctor/availability": {"methods": ["GET", "POST"]},
    "/api/doctor/time-off": {"methods": ["GET", "POST"]},
    "/api/prescriptions": {"methods": ["GET"]},
    "/api/prescriptions/999/pdf": {"methods": ["GET"]},
    "/api/prescriptions/orders": {"methods": ["GET"]},
    "/api/prescriptions/orders/999/pdf": {"methods": ["GET"]},
    "/api/admin/stats": {"methods": ["GET"]},
    "/api/admin/doctors": {"methods": ["GET", "POST"]},
    "/api/admin/doctors/999": {"methods": ["PATCH"]},
    "/api/admin/doctors/999/deactivate": {"methods": ["POST"]},
    "/api/admin/doctors/999/activate": {"methods": ["POST"]},
    "/api/admin/me/enable-doctor-profile": {"methods": ["POST"]},
    "/api/admin/patients": {"methods": ["GET"]},
    "/api/admin/prescriptions": {"methods": ["GET"]},
    "/api/admin/prescriptions/medical-orders": {"methods": ["GET"]},
    "/api/admin/prescriptions/999/pdf": {"methods": ["GET"]},
    "/api/admin/prescriptions/medical-orders/999/pdf": {"methods": ["GET"]},
    "/api/admin/prescriptions/doctors/999/activity": {"methods": ["GET"]},
    "/api/admin/audit-logs": {"methods": ["GET"]},
    "/api/admin/appointments": {"methods": ["GET"]},
    "/api/doctors/999/slots": {"methods": ["GET"]},
"/api/appointments": {"methods": ["POST"]},
"/api/appointments/mine": {"methods": ["GET"]},
"/api/appointments/999/cancel": {"methods": ["PATCH"]},
"/api/appointments/999/complete": {"methods": ["PATCH"]},
"/api/appointments/999/no-show": {"methods": ["PATCH"]},
"/api/doctor/patients/999/prescriptions/999/cancel": {"methods": ["PATCH"]},
    "/api/doctor/patients/999/orders/999/cancel": {"methods": ["PATCH"]},
    "/api/doctors/999/slots": {"methods": ["GET"]},
    "/api/doctor/patients/999/files": {"methods": ["GET", "POST"]},
    "/api/doctor/patients/999/files/999/download": {"methods": ["GET"]},
    "/api/doctor/patients/999/clinical-notes/999/amend": {"methods": ["POST"]},
    "/api/doctor/patients/999/prescriptions/999/cancel": {"methods": ["PATCH"]},
    "/api/doctor/patients/999/orders/999/cancel": {"methods": ["PATCH"]},
    "/api/doctors/999/slots": {"methods": ["GET"]},
    "/api/appointments/mine": {"methods": ["GET"]},
    "/api/appointments/999/cancel": {"methods": ["PATCH"]},
    "/api/appointments/999/complete": {"methods": ["PATCH"]},
"/api/appointments/999/no-show": {"methods": ["PATCH"]},
"/api/admin/doctors/999/deactivate": {"methods": ["POST"]},
    "/api/admin/doctors/999/activate": {"methods": ["POST"]},
    "/api/admin/me/enable-doctor-profile": {"methods": ["POST"]},
    "/api/admin/prescriptions/999/pdf": {"methods": ["GET"]},
    "/api/admin/prescriptions/medical-orders/999/pdf": {"methods": ["GET"]},
    "/api/admin/prescriptions/doctors/999/activity": {"methods": ["GET"]},
    "/api/admin/doctors/999/deactivate": {"methods": ["POST"]},
    "/api/admin/doctors/999/activate": {"methods": ["POST"]},
    "/api/admin/prescriptions/999/pdf": {"methods": ["GET"]},
    "/api/admin/prescriptions/medical-orders/999/pdf": {"methods": ["GET"]},
    "/api/admin/prescriptions/doctors/999/activity": {"methods": ["GET"]},
    "/api/doctor/patients/999/prescriptions/999/cancel": {"methods": ["PATCH"]},
    "/api/doctor/patients/999/orders/999/cancel": {"methods": ["PATCH"]},
    "/api/doctors/999/slots": {"methods": ["GET"]},
    "/api/doctor/patients/999/files/999/download": {"methods": ["GET"]},
    "/api/doctor/patients/999/clinical-notes/999/amend": {"methods": ["POST"]},
    "/api/doctor/patients/999/prescriptions/999/cancel": {"methods": ["PATCH"]},
    "/api/doctor/patients/999/orders/999/cancel": {"methods": ["PATCH"]},
    "/api/doctors/999/slots": {"methods": ["GET"]},
    "/api/appointments/mine": {"methods": ["GET"]},
"/api/appointments/999/cancel": {"methods": ["PATCH"]},
"/api/appointments/999/complete": {"methods": ["PATCH"]},
"/api/appointments/999/no-show": {"methods": ["PATCH"]},
}


def _normalize_path(path: str) -> str:
    """Normaliza path params a 999 para comparacion."""
    return re.sub(r"/\{[^}]+\}", "/999", path)


def _get_all_routes(app):
    """Extrae todas las rutas de la app, incluyendo las de routers incluidos recursivamente.
    Devuelve lista de objetos simples con atributos path (absoluto) y methods."""
    class RouteInfo:
        __slots__ = ("path", "methods")
        def __init__(self, path, methods):
            self.path = path
            self.methods = methods

    routes = []

    def extract_routes(router_list, prefix=""):
        for route in router_list:
            if hasattr(route, "path"):
                full_path = prefix + route.path
                if full_path.startswith("/api"):
                    routes.append(RouteInfo(full_path, route.methods))
            elif hasattr(route, "include_context"):
                include_prefix = getattr(route.include_context, "prefix", "")
                new_prefix = prefix + include_prefix
                extract_routes(route.original_router.routes, new_prefix)

    extract_routes(app.routes)
    return routes


def test_no_undeclared_routes():
    """Verifica que no hay rutas /api sin declarar en AUTH_MATRIX."""
    declared = set(AUTH_MATRIX.keys())

    all_routes = _get_all_routes(app)
    api_routes = set()
    for route in all_routes:
        normalized = _normalize_path(route.path)
        api_routes.add(normalized)

    excluded = {
        "/api/health",
        "/api/docs",
        "/api/redoc",
        "/api/openapi.json",
    }

    undeclared = api_routes - declared - excluded

    assert not undeclared, (
        f"Rutas /api sin declarar en AUTH_MATRIX: {sorted(undeclared)}. "
        "Agregalas a la matriz con sus metodos HTTP."
    )


def test_all_matrix_routes_exist():
    """Verifica que todas las rutas declaradas en AUTH_MATRIX existen en la app."""
    declared = set(AUTH_MATRIX.keys())

    all_routes = _get_all_routes(app)
    api_routes = set()
    for route in all_routes:
        normalized = _normalize_path(route.path)
        api_routes.add(normalized)

    missing = declared - api_routes
    assert not missing, (
        f"Rutas declaradas en AUTH_MATRIX pero no existen en la app: {sorted(missing)}"
    )


def test_declared_methods_match():
    """Verifica que los metodos HTTP declarados coinciden con la app."""
    for path, info in AUTH_MATRIX.items():
        declared_methods = set(info["methods"])
        actual_methods = set()

        all_routes = _get_all_routes(app)
        
        # Debug: print all routes that match this path
        matches = []
        for route in all_routes:
            if _normalize_path(route.path) == path:
                matches.append((route.path, route.methods))
        
        print(f"\nDEBUG: Path={path}, Matches={matches}")
        
        for route in all_routes:
            if _normalize_path(route.path) == path:
                if hasattr(route, "methods"):
                    actual_methods.update(route.methods)

        actual_methods.discard("HEAD")
        actual_methods.discard("OPTIONS")

        missing = declared_methods - actual_methods
        extra = actual_methods - declared_methods

        print(f"Path={path}, Declared={declared_methods}, Actual={actual_methods}, Missing={missing}, Extra={extra}")
        
        assert not missing, f"Ruta {path}: metodos declarados pero no implementados: {missing}"
        assert not extra, f"Ruta {path}: metodos implementados pero no declarados: {extra}"