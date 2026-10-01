from fastapi import FastAPI

app = FastAPI(
    title = "Virtual Clinic API",
    description = "API para el sistema de gestión de la clínica virtual",
    version = "1.0.0"
)

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "API funcionando correctamente",
        "service": "virtual-clinic-api"
    }