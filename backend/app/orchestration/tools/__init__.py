# backend/app/orchestration/tools/__init__.py
from .csv_tool import append_contact_csv_handler
from .time_tool import get_country_time_handler

def build_tools():
    # Aquí unificas todas las tools disponibles
    return [append_contact_csv_handler, get_country_time_handler]
