# backend/app/orchestration/tools/time_tool.py
from datetime import datetime
from zoneinfo import ZoneInfo
from langchain_core.tools import tool

# Mapeo simple país -> zona horaria principal (puedes ampliarlo)
COUNTRY_TZ = {
    "peru": "America/Lima",
    "mexico": "America/Mexico_City",
    "colombia": "America/Bogota",
    "argentina": "America/Argentina/Buenos_Aires",
    "chile": "America/Santiago",
    "spain": "Europe/Madrid",
}

@tool("get_country_time", description="Obtiene fecha y hora actual de un país.")
def get_country_time_handler(country: str) -> dict:
    key = country.strip().lower()
    tz_name = COUNTRY_TZ.get(key)
    if not tz_name:
        return {"ok": False, "error": "pais_no_soportado", "detail": f"No hay TZ para {country}."}

    now = datetime.now(ZoneInfo(tz_name))
    return {
        "ok": True,
        "country": country,
        "timezone": tz_name,
        "iso": now.isoformat(),
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M:%S"),
    }
