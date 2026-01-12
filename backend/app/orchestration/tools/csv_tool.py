from pathlib import Path
import csv
import re
from langchain_core.tools import tool

@tool("append_contact_csv", description="Guarda contacto en CSV con validaciones.")
def append_contact_csv_handler(
    filepath: str,
    nombres: str,
    apellidos: str | None,
    correo: str,
    telefono: str,
    delimiter: str = ","
) -> dict:
    # Validar teléfono: exactamente 9 dígitos
    if not re.fullmatch(r"\d{9}", telefono):
        return {"ok": False, "error": "telefono_invalido", "detail": "Debe tener 9 dígitos."}

    # Validación simple de correo (puedes reforzar con regex más estricto)
    if "@" not in correo or "." not in correo:
        return {"ok": False, "error": "correo_invalido", "detail": "Formato de correo no válido."}

    path = Path(filepath)
    headers = ["nombres", "apellidos", "correo", "telefono"]

    # 1) Crear archivo si no existe
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f, delimiter=delimiter)
            writer.writerow(headers)

    # 2) Insertar fila (apellidos opcional)
    with path.open("a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, delimiter=delimiter)
        writer.writerow([
            nombres.strip(),
            (apellidos or "").strip(),
            correo.strip().lower(),
            telefono.strip()
        ])

    return {"ok": True, "filepath": str(path)}
